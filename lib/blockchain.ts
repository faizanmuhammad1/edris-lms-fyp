import "server-only";

import { ethers, type InterfaceAbi } from "ethers";
import fs from "fs";
import path from "path";

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

function loadAbi(): InterfaceAbi {
  const abiPath = path.join(process.cwd(), "deployments", "LMSCertificate.json");
  const raw = fs.readFileSync(abiPath, "utf8");

  const parsed = JSON.parse(raw) as { abi?: InterfaceAbi } & Record<string, unknown>;
  // deployments/LMSCertificate.json is typically a Hardhat artifact JSON.
  // In that case, the actual ABI is under `abi`.
  return (parsed.abi ?? parsed) as InterfaceAbi;
}

function loadContractAddress(): string {
  const fromEnv = process.env.CONTRACT_ADDRESS;
  if (fromEnv) return fromEnv;

  const addressPath = path.join(
    process.cwd(),
    "deployments",
    "contract-address.json"
  );
  const raw = fs.readFileSync(addressPath, "utf8");
  const parsed = JSON.parse(raw) as { address?: string };
  if (!parsed.address) throw new Error("contract-address.json missing `address`");
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
}): Promise<{ payloadString: string; payloadHash: string }> {
  const payload = {
    uniqueId: data.uniqueId,
    studentName: data.studentName,
    courseName: data.courseName,
    issuedAt: data.issuedAt.toISOString(),
  };

  const payloadString = stableStringify(payload);
  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(payloadString));

  return { payloadString, payloadHash };
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

