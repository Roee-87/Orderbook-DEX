const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");

describe("Dai contract", function () {
  let Dai,
    Bat,
    Rep,
    Zrx,
    Dex,
    owner,
    trader1,
    trader2,
    _owner,
    _trader1,
    _trader2;
  Side = { BUY: 0, SEll: 1 };
  beforeEach(async () => {
    [_owner, _trader1, _trader2] = await ethers.getSigners();
    [owner, trader1, trader2] = [
      _owner.address,
      _trader1.address,
      _trader2.address,
    ];

    console.log(trader1, trader2);

    const Dai_f = await ethers.getContractFactory("Dai");
    Dai = await Dai_f.deploy(5000);

    const Bat_f = await ethers.getContractFactory("Bat");
    Bat = await Bat_f.deploy(5000);

    const Rep_f = await ethers.getContractFactory("Rep");
    Rep = await Rep_f.deploy(5000);

    const Zrx_f = await ethers.getContractFactory("Zrx");
    Zrx = await Zrx_f.deploy(5000);

    const Dex_f = await ethers.getContractFactory("Dex", owner);
    Dex = await Dex_f.deploy();
    await Dex.deployed();

    const [DAI, BAT, REP, ZRX] = ["DAI", "BAT", "REP", "ZRX"].map((ticker) =>
      ethers.utils.formatBytes32String(ticker)
    );

    await Dex.addToken(DAI, Dai.address);

    await Dex.addToken(BAT, Bat.address);
    await Dex.addToken(REP, Rep.address);
    await Dex.addToken(ZRX, Zrx.address);
    const answer = await Dex.tokenList(3);
    console.log(ethers.utils.parseBytes32String(answer));

    const _amount = 1000;
    const giveTraderTokens = async (token, trader) => {
      await token.approve(owner, _amount);
      await token.transferFrom(owner, trader, _amount);
    };
    await Promise.all(
      [Dai, Bat, Rep, Zrx].map((token) => giveTraderTokens(token, trader1))
    );
    await Promise.all(
      [Dai, Bat, Rep, Zrx].map((token) => giveTraderTokens(token, trader2))
    );

    // const trader2DaiBalance = await Dai.balanceOf(trader2);
    // console.log(`trader2 zrx balance is ${trader2DaiBalance.toNumber()}`);
  });

  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await Dai.balanceOf(owner);
    const trader1Balance = await Dai.balanceOf(trader1);
    const trader2Balance = await Dai.balanceOf(trader2);

    const ownerBalance_Bat = await Bat.balanceOf(owner);
    console.log(ownerBalance_Bat.toNumber());

    expect(await Dai.totalSupply()).to.equal(
      ownerBalance.toNumber() +
        trader1Balance.toNumber() +
        trader2Balance.toNumber()
    );
    describe("deposit", function () {
      it("let's approved traders deposit tokens into the DEX", async () => {
        const amount = ethers.utils.parseEther("100");
        //const num = await Dai.balanceOf(trader1);
        //console.log(amount);
        //console.log(Dex.address);
        Dai_ticker = ethers.utils.formatBytes32String("DAI");
        const Dex_ = await Dex.connect(_trader1);
        const Dai_ = await Dai.connect(_trader1);
        let answer = await Dai_.balanceOf(trader1);
        console.log(`trader1 has: ${answer} Dai tokens`);
        let result = await Dai_.approve(Dex_.address, 101, {
          from: trader1,
        });

        let val = await Dai.allowance(trader1, Dex.address);
        console.log(`DEX has authority to withdraw ${val} Dai tokens.`);

        await Dex_.deposit(100, ethers.utils.formatBytes32String("DAI"));

        const dex_balance = await Dai.balanceOf(Dex_.address);
        const trader1_balance = await Dai.balanceOf(trader1);
        console.log(`DEX now has a balance of ${dex_balance} tokens.`);
        console.log(
          `Trader 1 now has a Dai token balance of ${trader1_balance}`
        );
      });
    });
    describe("withdraw", function () {
      it("let's users withdraw their tokens from the DEX", async () => {
        const Dex_ = await Dex.connect(_trader1);
        const Dai_ = await Dai.connect(_trader1);
        let trader1_balance = await Dai.balanceOf(trader1);
        console.log(
          `trader1 has a balance of ${trader1_balance} Dai tokens before approval`
        );

        await Dai_.approve(Dex_.address, 2, {
          from: trader1,
        });
        trader1_balance = await Dai.balanceOf(trader1);
        console.log(
          `trader1 has a balance of ${trader1_balance} Dai tokens after approval`
        );
        await Dex_.deposit(2, ethers.utils.formatBytes32String("DAI"), {
          from: trader1,
        });
        trader1_balance = await Dai.balanceOf(trader1);
        console.log(
          `trader1 has a balance of ${trader1_balance} Dai tokens after deposit`
        );

        await Dex_.withdraw(1, ethers.utils.formatBytes32String("DAI"), {
          from: trader1,
        });
        trader1_balance = await Dai.balanceOf(trader1);
        console.log(
          `trader1 has a balance of ${trader1_balance} Dai tokens after withdrawl`
        );
      });
    });
    describe("createLimitOrder", function () {
      it("reverts if token traded is Dai", async () => {
        const Dex_ = await Dex.connect(_trader1);
        const Dai_ = await Dai.connect(_trader1);
        let trader1_balance = await Dai.balanceOf(trader1);
        console.log(
          `trader1 has a balance of ${trader1_balance} Dai tokens before createLimitOrder()`
        );
        const DAI_ = ethers.utils.formatBytes32String("DAI");
        await expect(Dex_.createLimitOrder(DAI_, 50, 2, 1)).to.be.revertedWith(
          "Cannot trade DAI!"
        );
      });
      it("creates a limit order for REP tokens", async () => {
        const Dex_ = await Dex.connect(_trader1);
        const Dai_ = await Dai.connect(_trader1);
        const REP_ = ethers.utils.formatBytes32String("REP");
        await Dex_.createLimitOrder(REP_, 12, 8, 0);
        const buyOrders = await Dex_.getOrders(REP_, 0);
        assert(buyOrders.length === 1);
        assert(buyOrders[0].trader == trader1);
        console.log(buyOrders[0].trader);
      });
    });
  });
});
