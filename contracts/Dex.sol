// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Dex {
    //Enum types
    enum Side {
        BUY,
        SELL
    }

    //variables
    address public admin;
    uint256 public nextOrderId;
    bytes32 private immutable DAI = bytes32("DAI");
    uint256 public nextTradeId;
    bytes32[] public tokenList;

    //structs and arrays
    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    struct Order {
        uint256 id;
        address trader;
        Side side;
        bytes32 ticker;
        uint256 amount;
        uint256 filled;
        uint256 price;
        uint256 date;
    }

    //mappings

    mapping(bytes32 => Token) public tokens;
    mapping(address => mapping(bytes32 => uint256)) public traderBalances; //balance of each trader
    mapping(bytes32 => mapping(uint => Order[])) orderBook;

    //events
    event NewTrade(
        uint256 tradeId,
        uint256 orderId,
        bytes32 indexed ticker,
        address indexed trader1,
        address indexed trader2,
        uint256 amount,
        uint256 price,
        uint256 date
    );

    //modifiers
    modifier onlyAdmin() {
        require(admin == msg.sender, "Only Admin can call this function!");
        _;
    }

    modifier onlyApprovedTokens(bytes32 ticker) {
        require(
            tokens[ticker].tokenAddress != address(0),
            "Token has NOT been approved!"
        );
        _;
    }

    modifier tokenIsNotDai(bytes32 ticker) {
        require(ticker != bytes32("DAI"), "Cannot trade DAI!");
        _;
    }

    //constructor
    constructor() {
        admin = msg.sender;
    }

    //functions
    function addToken(bytes32 ticker, address tokenAddress) external onlyAdmin {
        tokens[ticker] = Token(ticker, tokenAddress);
        tokenList.push(ticker);
    }

    // function approveToken(bytes32 _token, uint256 _ammount) external {
    //     address tokenAddr = tokens[_token].tokenAddress;
    //     IERC20(tokenAddr).approve(address(this), _ammount);
    // }

    // function getTokenAllowance(bytes32 _token) external view {
    //     address tokenAddr = tokens[_token].tokenAddress;
    //     IERC20(tokenAddr).allowance(msg.sender, address(this));
    // }

    function deposit(uint256 amount, bytes32 ticker)
        external
        onlyApprovedTokens(ticker)
    {
        IERC20(tokens[ticker].tokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        traderBalances[msg.sender][ticker] += amount;
    }

    function withdraw(uint256 amount, bytes32 ticker)
        external
        onlyApprovedTokens(ticker)
    {
        require(
            traderBalances[msg.sender][ticker] >= amount,
            "You're balance is less than what you're trying to withdraw!"
        );
        traderBalances[msg.sender][ticker] -= amount;
        IERC20(tokens[ticker].tokenAddress).transfer(msg.sender, amount);
    }

    function createLimitOrder(
        bytes32 ticker,
        uint256 amount,
        uint256 price,
        Side side
    ) external onlyApprovedTokens(ticker) tokenIsNotDai(ticker) {
        if (side == Side.SELL) {
            require(
                traderBalances[msg.sender][ticker] >= amount,
                "token balance too low, buddy!"
            );
        } else {
            require(
                traderBalances[msg.sender][DAI] >= amount * price,
                "Dai balance too low, buddy!"
            );
        }
        Order[] storage orders = orderBook[ticker][uint8(side)];
        orders.push(
            Order(
                nextOrderId,
                msg.sender,
                side,
                ticker,
                amount,
                0,
                price,
                block.timestamp
            )
        );
        uint256 i = orders.length - 1;
        while (i > 0) {
            if (side == Side.BUY && orders[i - 1].price > orders[i].price) {
                break;
            }
            if (side == Side.SELL && orders[i - 1].price < orders[i].price) {
                break;
            }
            Order memory order = orders[i - 1];
            orders[i - 1] = orders[i];
            orders[i] = order;
            i--;
        }
        nextOrderId++;
    }

    function createMarketOrder(
        bytes32 ticker,
        uint256 amount,
        Side side
    ) public onlyApprovedTokens(ticker) tokenIsNotDai(ticker) {
        if (side == Side.SELL) {
            require(
                traderBalances[msg.sender][ticker] >= amount,
                "token balance too low, buddy!"
            );
        }
        Order[] storage orders = orderBook[ticker][
            uint256(side == Side.BUY ? Side.SELL : Side.BUY)
        ];
        uint256 i;
        uint256 remaining = amount;

        while (i < orders.length && remaining > 0) {
            uint available = orders[i].amount - orders[i].filled;
            uint matched = (remaining > available) ? available : remaining;
            remaining -= matched;
            orders[i].filled += matched;
            emit NewTrade(
                nextTradeId,
                orders[i].id,
                ticker,
                orders[i].trader,
                msg.sender,
                matched,
                orders[i].price,
                block.timestamp
            );
            if (side == Side.SELL) {
                traderBalances[msg.sender][ticker] -= matched;
                traderBalances[msg.sender][DAI] += matched * orders[i].price;
                traderBalances[orders[i].trader][ticker] += matched;
                traderBalances[orders[i].trader][DAI] -=
                    matched *
                    orders[i].price;
            }
            if (side == Side.BUY) {
                require(
                    traderBalances[msg.sender][DAI] >=
                        matched * orders[i].price,
                    "dai balance too low"
                );
                traderBalances[msg.sender][ticker] += matched;
                traderBalances[msg.sender][DAI] -= matched * orders[i].price;
                traderBalances[orders[i].trader][ticker] -= matched;
                traderBalances[orders[i].trader][DAI] +=
                    matched *
                    orders[i].price;
            }
            nextTradeId++;
            i++;
        }

        i = 0;
        while (i < orders.length && orders[i].filled == orders[i].amount) {
            for (uint j = i; j < orders.length - 1; j++) {
                orders[j] = orders[j + 1];
            }
            orders.pop();
            i++;
        }
    }

    function getOrders(bytes32 ticker, Side side)
        external
        view
        returns (Order[] memory)
    {
        return orderBook[ticker][uint(side)];
    }

    function getTokens() external view returns (Token[] memory) {
        Token[] memory _tokens = new Token[](tokenList.length);
        for (uint i = 0; i < tokenList.length; i++) {
            _tokens[i] = Token(
                tokens[tokenList[i]].ticker,
                tokens[tokenList[i]].tokenAddress
            );
        }
        return _tokens;
    }
}
