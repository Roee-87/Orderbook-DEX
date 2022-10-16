const { ethers, run, network } = require("hardhat");
const dexABI = require("./dexABI.json");

async function main() {
  //   const [DAI, BAT, REP, ZRX] = ["DAI", "BAT", "REP", "ZRX"].map((ticker) =>
  //     ethers.utils.formatBytes32String(ticker)
  //   );

  const accounts = await ethers.getSigners();
  const provider = accounts[0];
  const Dex = await new ethers.Contract(
    "0xdd267737631ed25904f62622cf4a54d9f07ea455",
    dexABI,
    provider
  );

  //await Dex.addToken(DAI, Dai.address);
  // await Dex.addToken(BAT, "0x6206Ae429677EE65bF5Ea172730ccEB61BD91CE7");
  // await Dex.addToken(REP, "0x68F68Eb786A437F07B44668e33383ddA066eBE81");
  //await Dex.addToken(ZRX, "0xb87A2B3C7DE4264dA1A2fC281a18607A4C4C431f");

  const tokens = await Dex.getTokens();
  console.log(tokens);
  console.log(accounts);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
