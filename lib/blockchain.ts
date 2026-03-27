import "server-only";

import { ethers, type InterfaceAbi } from "ethers";
import contractAddressArtifact from "@/deployments/contract-address.json";

/** Inlined from deployments/LMSCertificate.json — avoids ENOENT on Vercel serverless. */
const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "certificateId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "certIdHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "payloadHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "issuedAt",
        type: "uint64",
      },
    ],
    name: "CertificateIssued",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "certificateId",
        type: "string",
      },
    ],
    name: "isIssued",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "certificateId",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "payloadHash",
        type: "bytes32",
      },
    ],
    name: "issueCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "certificateId",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "payloadHash",
        type: "bytes32",
      },
    ],
    name: "verifyCertificate",
    outputs: [
      {
        internalType: "bool",
        name: "isValid",
        type: "bool",
      },
      {
        internalType: "bytes32",
        name: "storedHash",
        type: "bytes32",
      },
      {
        internalType: "uint64",
        name: "issuedAt",
        type: "uint64",
      },
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

function getEnvOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function stableStringify(value: unknown): string {
  // Canonical JSON stringification with lexicographically sorted object keys.
  if (value === null || typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const props = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${props.join(",")}}`;
}

export type CertificatePayloadFields = {
  uniqueId: string;
  studentName: string;
  courseName: string;
  issuedAt: string;
};

export function buildCanonicalCertificatePayload(fields: CertificatePayloadFields) {
  // Keep explicit key order for readability; hashing remains canonical via stableStringify.
  return {
    courseName: fields.courseName,
    issuedAt: fields.issuedAt,
    studentName: fields.studentName,
    uniqueId: fields.uniqueId,
  };
}

export function computeCertificatePayloadHash(fields: CertificatePayloadFields): {
  payload: ReturnType<typeof buildCanonicalCertificatePayload>;
  payloadString: string;
  payloadHash: string;
} {
  const payload = buildCanonicalCertificatePayload(fields);
  const payloadString = stableStringify(payload);
  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(payloadString));
  return { payload, payloadString, payloadHash };
}

function loadAbi(): InterfaceAbi {
  return CONTRACT_ABI as unknown as InterfaceAbi;
}

function loadContractAddress(): string {
  const fromEnv = process.env.CONTRACT_ADDRESS;
  if (fromEnv) return fromEnv;
  const parsed = contractAddressArtifact as { address?: string };
  if (!parsed.address) {
    throw new Error("contract-address.json missing `address`");
  }
  return parsed.address;
}

function getContract() {
  const rpcUrl = getEnvOrThrow("POLYGON_RPC_URL");
  const privateKey = getEnvOrThrow("BLOCKCHAIN_PRIVATE_KEY");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const abi = loadAbi();
  const contractAddress = loadContractAddress();

  return new ethers.Contract(contractAddress, abi, wallet);
}

export async function buildCertificatePayload(data: {
  uniqueId: string;
  studentName: string;
  courseName: string;
  issuedAt: Date;
}): Promise<{ payloadString: string; payloadHash: string; qrData: string }> {
  const issuedAtIso = data.issuedAt.toISOString();
  const { payloadString, payloadHash } = computeCertificatePayloadHash({
    uniqueId: data.uniqueId,
    studentName: data.studentName,
    courseName: data.courseName,
    issuedAt: issuedAtIso,
  });

  const ipfsUrl =
    process.env.NEXT_PUBLIC_IPFS_VERIFY_URL ??
    "https://ipfs.io/ipfs/bafkreibti6dmagofnnycnfind4ois2lua5zouoojzfzqcakq3pjywqysuu";

  const qrData = ipfsUrl;

  return { payloadString, payloadHash, qrData };
}

export async function buildPayloadFromQR(qrData: string): Promise<{
  payloadHash: string;
  parsed: {
    studentName: string;
    courseName: string;
    issuedAt: string;
    uniqueId: string;
  };
}> {
  const raw = JSON.parse(qrData) as {
    n: string;
    c: string;
    d: string;
    id: string;
  };

  const parsed = {
    studentName: raw.n,
    courseName: raw.c,
    issuedAt: raw.d,
    uniqueId: raw.id,
  };

  const { payloadHash } = computeCertificatePayloadHash(parsed);

  return { payloadHash, parsed };
}

export async function issueCertificateOnChain(
  certificateId: string,
  payloadHash: string
): Promise<{ txHash: string; blockNumber: number }> {
  try {
    if (!certificateId) throw new Error("certificateId is required");
    if (!payloadHash) throw new Error("payloadHash is required");

    const contract = getContract();

    const tx = await contract.issueCertificate(certificateId, payloadHash);
    const receipt = await tx.wait(1);

    if (receipt?.blockNumber === undefined) {
      throw new Error("Transaction receipt missing blockNumber");
    }

    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : `Unknown error: ${String(err)}`;
    throw new Error(`Failed to issue certificate on-chain: ${message}`);
  }
}

export async function verifyCertificateOnChain(
  certificateId: string,
  payloadHash: string
): Promise<{
  isValid: boolean;
  storedHash: string;
  issuedAt: number;
  issuer: string;
}> {
  try {
    if (!certificateId) throw new Error("certificateId is required");
    if (!payloadHash) throw new Error("payloadHash is required");

    const rpcUrl = getEnvOrThrow("POLYGON_RPC_URL");
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const abi = loadAbi();
    const contractAddress = loadContractAddress();
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const result = await contract.verifyCertificate(certificateId, payloadHash);

    return {
      isValid: Boolean(result[0]),
      storedHash: result[1] as string,
      issuedAt: Number(result[2] as bigint),
      issuer: result[3] as string,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : `Unknown error: ${String(err)}`;
    throw new Error(`Failed to verify certificate on-chain: ${message}`);
  }
}

