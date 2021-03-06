import services from '../../../util/services'

var domain = 'https://15580083.qcloud.la/'
var qcloud = require('../../../vendor/qcloud-weapp-client-sdk/index');

// 显示繁忙提示
var showBusy = text => wx.showToast({
    title: text,
    icon: 'loading',
    duration: 10000
});

// 显示成功提示
var showSuccess = text => wx.showToast({
    title: text,
    icon: 'success'
});

// 显示失败提示
var showModel = (title, content) => {
    wx.hideToast();
    wx.showModal({
        title,
        content: JSON.stringify(content),
        showCancel: false
    });
};

var pageObject = {
  data: {
    unfinishedOrderList: '',
    historyOrderList: '',
    indexOrderList: [],
    orderList: [],
    shopInfo: wx.getStorageSync('shopInfo'),    
    leftPartClass: 'header-left-part active',
    rightPartClass: 'header-right-part',
    shop_id: '',
    tabState: 'left',
    total_price: '0',
    total_price_rmb: '0',
    inputPhoneNumber: '',

    inputConsignee: '',
    inputPSP: '',
    inputFLT: '',
    inputYear: '',
    inputMonth: '',
    inputDay: '',

    doneModalStatus: false,
    inputModalState: false,
    fullInputModalState: false,
    needPay: false,
    modalProps: {
      text: ''
    },
    footbarState: {
      tabStatus: 'orderCenter',
      cartBadgeNum: wx.getStorageSync('cartBadgeNum')
    }
  },
  onShow: function() {
    var _this = this
    this.getCartList()
    wx.setStorageSync('tabStatus', 'orderCenter')
    this.setData({ 'shopInfo': wx.getStorageSync('shopInfo') })
    this.setData({ 'shop_id': wx.getStorageSync('shop_id') })
    this.setData({ "footbarState.cartBadgeNum": wx.getStorageSync('cartBadgeNum') })
  },
  onLoad: function() {
  },
  getCartList: function() {
    var orderLists = []
    var _this = this
    wx.request({
      url: domain + 'V2/weapp/cart_list',
      data: {
        uid: wx.getStorageSync('uid'),
        shop_id: wx.getStorageSync('shop_id')
      },
      success(res) {
        console.log(res)
        if (res.data.data.length == 0) {
          return false;
        }
        var temp = 0
        var temp_rmb = 0
        res.data.data.map(function(index) {
          temp = temp + parseInt(index.order.price)
          temp_rmb = temp_rmb + parseInt(index.product.RMB) * parseInt(index.order.number)
        })
        _this.setData({
          orderList: res.data.data,
          total_price: temp,
          total_price_rmb: temp_rmb
        })
      },
      error(res) {
        console.log(res.data.data)
      }
    })
  },
  showHistoryOrderList: function() {
    this.setData({indexOrderList: this.data.historyOrderList})
    this.setData({
      rightPartClass: 'header-right-part active',
      leftPartClass: 'header-right-part',
      tabState: 'right'
    })
  },
  showUnfinishedOrderList: function() {
    this.setData({indexOrderList: this.data.unfinishedOrderList})
    this.setData({
      rightPartClass: 'header-right-part',
      leftPartClass: 'header-right-part active',
      tabState: 'left'
    })
  },
  // 需要支付
  // 无需手机号弹窗
  handleConfirmBtn: function() {
      var _this = this
      if (this.data.orderList.length == 0) {
          showModel('尚无商品', '请先去商品目录挑选商品');
          return false;
      }
      if (wx.getStorageSync('shop_id') == 1) {
        showBusy('正在通信..');
        wx.request({
            url: domain + 'V2/order/combineOrder',
            data: {
                uid: wx.getStorageSync('uid'),
                shop_id: wx.getStorageSync('shop_id')        
            },
            success(res) {
              if (res.data.code == '0') {
                showModel('操作失败', res.data.msg)
                return;
              }              
              if (res.data.data) {
                  _this.callPay(res.data.data)
              }
            }
        })
      }
      // 如果shop_id == 2
      if (wx.getStorageSync('shop_id') == 2) {
        this.setData({
          fullInputModalState: true,
          needPay: true
        })        
      }
  },
  // 无需支付
  // 预购订单用confirm，手机号弹窗
  handleCombineBtn: function() {
    if (this.data.orderList.length == 0) {
      showModel('尚无商品', '请先去商品目录挑选商品');
      return false;
    }
    if (wx.getStorageSync('shop_id') == '1') {
      this.setData({
        inputModalState: true,
        needPay: false
      })
    } 
    if (wx.getStorageSync('shop_id') == '2') {
      this.setData({
        fullInputModalState: true,
        needPay: false
      })
    }
    
  },
  inputModalCancel: function() {
    this.setData({
      inputModalState: false,
      fullInputModalState: false
    })
  },
  bindKeyInput: function(e) {
    this.setData({ inputPhoneNumber: e.detail.value })
  },
  bindConsigneeInput: function(e) {
    this.setData({ inputConsignee: e.detail.value })
  },
  bindPSPInput: function(e) {
    this.setData({ inputPSP: e.detail.value })
  },
  bindFLTInput: function(e) {
    this.setData({ inputFLT: e.detail.value })
  },
  bindYearInput: function(e) {
    this.setData({ inputYear: e.detail.value })
  },
  bindMonthInput: function(e) {
    // this.setData({ inputMonth: parseInt(e.detail.value) < 10 ? '0' + e.detail.value : e.detail.value })
    this.setData({ inputMonth: e.detail.value })
  },
  bindDayInput: function(e) {
    this.setData({ inputDay: e.detail.value })
  },
  confirmOrder: function() {
    var _this = this
    showBusy('正在通信..');
    _this.inputModalCancel()
    if (wx.getStorageSync('shop_id') == 1) {
      wx.request({
          url: domain + 'V2/order/confirmOrder',
          data: {
              phone: _this.data.inputPhoneNumber,
              uid: wx.getStorageSync('uid'),
              shop_id: wx.getStorageSync('shop_id'),
          },
          success(res) {
            if (res.data.code == '0') {
              showModel('操作失败', res.data.msg)
              return ;
            }
            if (res.data.code == '1') {
                // showSuccess('订单已提交');
                wx.setStorageSync('cartBadgeNum', 0)
                _this.setData({
                    orderList: '',
                    total_price: 0,
                    total_price_rmb: 0,
                    "footbarState.cartBadgeNum": 0
                })
                wx.hideToast();
                _this.setData({
                    "modalProps.text": '已成功生成订单，预定商品库存有限，请到夏威夷T广场免税店4层提货处完成付款步骤确保顺利提货，售完即止，如有任何问题请与客服联系。',
                    doneModalStatus: true
                })
            }
          }
      })
    }
    if (wx.getStorageSync('shop_id') == 2) {
      if (!_this.data.needPay) {
        // 店铺2预留订单
        wx.request({
            url: domain + 'V2/order/confirmOrder',
            data: {
                uid: wx.getStorageSync('uid'),
                shop_id: wx.getStorageSync('shop_id'),
                consignee: _this.data.inputConsignee,
                psp_num: _this.data.inputPSP,
                flt_num: _this.data.inputFLT,
                takeoff_time: _this.data.inputYear + '-' +  _this.data.inputMonth + '-' +  _this.data.inputDay
            },
            success(res) {
              if (res.data.code == '0') {
                showModel('操作失败', res.data.msg)
                return;
              }              
              if (res.data.code == '1') {
                  // showSuccess('订单已提交');
                  wx.setStorageSync('cartBadgeNum', 0)
                  _this.setData({
                      orderList: '',
                      total_price: 0,
                      total_price_rmb: 0,
                      "footbarState.cartBadgeNum": 0
                  })
                  wx.hideToast();
                  _this.setData({
                    "modalProps.text": '顾客需在登机前3小时预定，已成功生成订单，预定已成功预订产品库存有限，请至少在飞机起飞前一小时，于旧金山机场免税店国际离境G区Chopard腕表专柜，或者A区Pandora首饰专柜，完成身份核实以及付款手续，确保顺利提货。未付款前，产品存货不予保障。售完即止，如有任何问题请与客服联系。',
                      doneModalStatus: true
                  })
              }
            }
        })
      }
      if (_this.data.needPay) {
        // 店铺2立即支付
        wx.request({
            url: domain + 'V2/order/combineOrder',
            data: {
                uid: wx.getStorageSync('uid'),
                shop_id: wx.getStorageSync('shop_id'),
                consignee: _this.data.inputConsignee,
                psp_num: _this.data.inputPSP,
                flt_num: _this.data.inputFLT,
                birthdate: _this.data.inputYear + '-' + _this.data.inputMonth + '-' +  _this.data.inputDay
            },
            success(res) {
              if (res.data.code == '0') {
                showModel('操作失败', res.data.msg)
                return;
              }              
              if (res.data.data) {
                  _this.callPay(res.data.data)
              }
            }
        })        
      }
    }
  },
  callPay(order_id) {
      var _this = this
      wx.request({
          url: domain + 'V2/Wechatpay/callPay',
          data: {
              order_id: order_id,
              uid: wx.getStorageSync('uid'),
              shop_id: wx.getStorageSync('shop_id')
          },
          success(res) {
              wx.hideToast();
              // 之前
              if (JSON.parse(res.data.data).result == 'success') {
                  wx.requestPayment({
                      'timeStamp': JSON.parse(res.data.data).data.timeStamp,
                      'nonceStr': JSON.parse(res.data.data).data.nonceStr,
                      'package': JSON.parse(res.data.data).data.package,
                      'signType': JSON.parse(res.data.data).data.signType,
                      'paySign': JSON.parse(res.data.data).data.paySign,
                      'success': function() {
                          // 支付成功
                          wx.setStorageSync('cartBadgeNum', 0)
                          _this.setData({
                              orderList: '',
                              total_price: 0,
                              total_price_rmb: 0,
                              "footbarState.cartBadgeNum": 0
                          })
                          _this.setData({
                              "modalProps.text": '订单已经生成，请到夏威夷T广场免税店4层提货处提货，如有任何问题请与客服联系。谢谢惠顾！',
                              doneModalStatus: true
                          })
                      },
                      'fail': function(res) {
                          showModel('支付失败', '请重新尝试支付')
                      }
                  })
              } else {
                  showModel('拉起支付失败', JSON.parse(res.data.data).result)
              }
          }
      })
  },
  emptyCartEvent() {
    var _this = this
    wx.showModal({
      title: '确认清空购物车？',
      content: '清空购物车后，商品需要重新选购',
      success: function(res) {
        if (res.confirm) {
          _this.emptyCart()
        }
      }
    })
  },
  orderChange(event) {
    var _this = this
    var _id = event.currentTarget.dataset.id
    var _option = event.currentTarget.dataset.option
    var _index = event.currentTarget.dataset.index
    wx.request({
      url: domain + 'V2/order/changeCartNumber',
      data: {
        id: _id,
        option: _option,
        shop_id: wx.getStorageSync('shop_id')        
      },
      success(res) {
        console.log(res)
        if (res.data.code != '1') {
          showModel('操作失败', res.data.msg)
          return false;
        }
        var tempOrderList = _this.data.orderList
        // 如果减不了了
        if (tempOrderList[_index].order.number <=1 && _option == '-1') {
          _this.deleteOrder({ currentTarget: { dataset: { id: _id } } })
        }
        // 如果还能减
        tempOrderList[_index].order.number = parseInt(tempOrderList[_index].order.number) + parseInt(_option)
        _this.setData({
          orderList: tempOrderList
        })
        _this.priceReload(tempOrderList)
      }
    })
  },
  deleteOrder(event) {
    var _this = this
    var targetId = event.currentTarget.dataset.id
    showBusy('通信中..')
    wx.request({
      url: domain + 'V2/order/deleteOrder',
      data: {
        id : targetId,
        shop_id: wx.getStorageSync('shop_id')        
      },
      success(res) {
        if (res.data.code == '1') {
          var newOrderList = []
          _this.data.orderList.map(function(item) {
            if (item.order.id == targetId) {
            } else {
              newOrderList.push(item)
            }
          })
          _this.priceReload(newOrderList)
          wx.setStorageSync('cartBadgeNum', parseInt(wx.getStorageSync('cartBadgeNum')) - 1)
          showSuccess('删除完成')
          _this.setData({
            orderList: newOrderList,
            "footbarState.cartBadgeNum": wx.getStorageSync('cartBadgeNum')
          })          
        }
      },
      error(res) {
        console.log(res)
      }
    })
  },
  priceReload(newOrderList) {
    var _this = this
    var temp = 0
    var temp_rmb = 0
    newOrderList.map(function(index) {
      temp = temp + parseInt(index.product.price) * parseInt(index.order.number)
      temp_rmb = temp_rmb + parseInt(index.product.RMB) * parseInt(index.order.number)
    })
    _this.setData({
      total_price: temp,
      total_price_rmb: temp_rmb,
    })
  },
  modalHide() {
    this.setData({
      doneModalStatus: false
    })
  },
  routerGoHistoryOrders() {
    wx.navigateTo({
      url: "../history-orders/history-orders"
    })
  },
  routerGoHome: function() {
    wx.redirectTo({
      url: '../home/home'
    })
  }
}

Page(pageObject)
