/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultBatchingStrategy
 */

'use strict';

var ReactUpdates = require('ReactUpdates');
var Transaction = require('Transaction');

var emptyFunction = require('emptyFunction');
// 定义复位 wrapper
var RESET_BATCHED_UPDATES = {
  // 初始化调用
  initialize: emptyFunction,
  // 事务执行完成
  close: function() {
    // 事务批更新处理结束时，将isBatchingUpdates设为了false
    ReactDefaultBatchingStrategy.isBatchingUpdates = false; // 结束本次batch
  },
};
// 定义批更新 wrapper
var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates), // 批量更新
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction();
}

Object.assign(
  ReactDefaultBatchingStrategyTransaction.prototype,
  Transaction,
  {
    getTransactionWrappers: function() {
      return TRANSACTION_WRAPPERS;
    },
  }
);
// 实例化事务
var transaction = new ReactDefaultBatchingStrategyTransaction();

var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   * 在一个上下文中调用提供的函数，在该上下文中，对`setState`和friends的调用是成批的，这样组件就不会被不必要地更新。
   */
  batchedUpdates: function(callback, a, b, c, d, e) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;
    // 批处理最开始时，将isBatchingUpdates设为true，表明正在更新
    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    // The code is written this way to avoid extra allocations
    if (alreadyBatchingUpdates) {
      return callback(a, b, c, d, e);
    } else {
      // 以事务的方式处理updates
      return transaction.perform(callback, null, a, b, c, d, e);
    }
  },
};

module.exports = ReactDefaultBatchingStrategy;
