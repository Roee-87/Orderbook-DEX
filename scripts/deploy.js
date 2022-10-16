const { ethers, run, network } = require("hardhat");

async function main() {
  const [DAI, BAT, REP, ZRX] = ["DAI", "BAT", "REP", "ZRX"].map((ticker) =>
    ethers.utils.formatBytes32String(ticker)
  );

  const Dai_f = await ethers.getContractFactory("Dai");
  const Dai = await Dai_f.deploy(ethers.utils.parseEther("5000"));
  await Dai.deployed();
  console.log(`Dai contract to: ${Dai.address}`);

  const Bat_f = await ethers.getContractFactory("Bat");
  const Bat = await Bat_f.deploy(ethers.utils.parseEther("5000"));
  await Bat.deployed();
  console.log(`Bat contract to: ${Bat.address}`);

  const Rep_f = await ethers.getContractFactory("Rep");
  const Rep = await Rep_f.deploy(ethers.utils.parseEther("5000"));
  await Rep.deployed();
  console.log(`Rep contract to: ${Rep.address}`);

  const Zrx_f = await ethers.getContractFactory("Zrx");
  const Zrx = await Zrx_f.deploy(ethers.utils.parseEther("5000"));
  await Zrx.deployed();
  const Zrx_supply = await Zrx.totalSupply();
  console.log(`Zrx contract to: ${Zrx.address} with ${Zrx_supply} tokens`);

  const Dex_f = await ethers.getContractFactory("Dex");
  const Dex = await Dex_f.deploy();
  await Dex.deployed();
  console.log(`Dex deployed to ${Dex.address}`);

  await Dex.addToken(DAI, Dai.address);
  await Dex.addToken(BAT, Bat.address);
  await Dex.addToken(REP, Rep.address);
  await Dex.addToken(ZRX, Zrx.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
