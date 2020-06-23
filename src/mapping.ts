import { MarketCreated as MarketCreatedEvent } from '../generated/BinaryOptionMarketManager/BinaryOptionMarketManager';
import {
  Bid as BidEvent,
  Refund as RefundEvent,
  BinaryOptionMarket,
} from '../generated/templates/BinaryOptionMarket/BinaryOptionMarket';
import { Market, OptionTransaction } from '../generated/schema';
import { BinaryOptionMarket as BinaryOptionMarketContract } from '../generated/templates';
import { BigInt } from '@graphprotocol/graph-ts';

export function handleNewMarket(event: MarketCreatedEvent): void {
  BinaryOptionMarketContract.create(event.params.market);
  let binaryOptionContract = BinaryOptionMarket.bind(event.params.market);
  let prices = binaryOptionContract.prices();

  let entity = new Market(event.params.market.toHex());
  entity.creator = event.params.creator;
  entity.timestamp = event.block.timestamp;
  entity.currencyKey = event.params.oracleKey;
  entity.strikePrice = event.params.strikePrice;
  entity.biddingEndDate = event.params.biddingEndDate;
  entity.maturityDate = event.params.maturityDate;
  entity.expiryDate = event.params.expiryDate;
  entity.isOpen = true;
  entity.longPrice = prices.value0;
  entity.shortPrice = prices.value1;
  entity.poolSize = binaryOptionContract.exercisableDeposits();
  entity.save();
}

export function handleNewBid(event: BidEvent): void {
  let marketId = event.address.toHex();
  let binaryOptionContract = BinaryOptionMarket.bind(event.address);
  let marketEntity = Market.load(marketId);
  let entity = new OptionTransaction(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );
  entity.type = 'bid';
  entity.timestamp = event.block.timestamp;
  entity.account = event.params.account;
  entity.market = event.address;
  entity.currencyKey = marketEntity.currencyKey;
  entity.side = BigInt.fromI32(event.params.side).toString();
  entity.amount = event.params.value;
  entity.save();

  let prices = binaryOptionContract.prices();
  marketEntity.longPrice = prices.value0;
  marketEntity.shortPrice = prices.value1;
  marketEntity.poolSize = binaryOptionContract.exercisableDeposits();
  marketEntity.save();
}

export function handleNewRefund(event: RefundEvent): void {
  let marketId = event.address.toHex();
  let market = Market.load(marketId);
  let binaryOptionContract = BinaryOptionMarket.bind(event.address);
  let marketEntity = Market.load(marketId);
  let entity = new OptionTransaction(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );
  entity.type = 'refund';
  entity.timestamp = event.block.timestamp;
  entity.account = event.params.account;
  entity.market = event.address;
  entity.currencyKey = market.currencyKey;
  entity.side = BigInt.fromI32(event.params.side).toString();
  entity.amount = event.params.value;
  entity.fee = event.params.fee;
  entity.save();

  let prices = binaryOptionContract.prices();
  marketEntity.longPrice = prices.value0;
  marketEntity.shortPrice = prices.value1;
  marketEntity.poolSize = binaryOptionContract.exercisableDeposits();
  marketEntity.save();
}
