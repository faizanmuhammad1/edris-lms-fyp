import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const { ethers } = hre as any;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  const LMSCertificate = await ethers.getContractFactory("LMSCertificate");
  const contract = await LMSCertificate.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LMSCertificate deployed to:", address);

  // Save address for use in app
  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);

  fs.writeFileSync(
    path.join(deploymentsDir, "contract-address.json"),
    JSON.stringify({ address, network: "amoy", chainId: 80002 }, null, 2)
  );

  // Copy ABI
  const artifactPath = path.join(
    process.cwd(),
    "artifacts/contracts/LMSCertificate.sol/LMSCertificate.json"
  );
  if (fs.existsSync(artifactPath)) {
    fs.copyFileSync(
      artifactPath,
      path.join(deploymentsDir, "LMSCertificate.json")
    );
    console.log("ABI saved to deployments/LMSCertificate.json");
  }

  console.log("Done! Add this to your .env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

