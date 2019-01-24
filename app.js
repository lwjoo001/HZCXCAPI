//app.js
App({
	onLaunch: function() {

	},
	globalData: {
		userInfo: null
	},
	// es6微信请求
	HZWxRequest(xurl, sk, method, needSK, data) {
		let that = this,
			token_time = parseInt(new Date().getTime() / 1000),
			token = null,
			temporaryObj = {},
			requestData = null
		temporaryObj.token_time = token_time
		if (that.HZGetKeysNumber(data) === 0) {
			requestData = temporaryObj
		} else {
			requestData = Object.assign(data, temporaryObj)
		}
		token = that.jsonSortEnc(requestData)
		wx.showLoading({
			title: '加载中',
			mask: true
		})
		let headerObj = {
			'content-type': 'application/x-www-form-urlencoded;application/json',
			'token': token,
			'version': version
		}
		if (needSK === true) {
			headerObj['session-key'] = sk
		}
		return new Promise(function(resolve, reject) {
			wx.request({
				url: xurl,
				data: requestData,
				method: method,
				header: headerObj,
				success: function(res) {
					resolve(res.data)
				},
				fail(res) {
					reject(res.data)
				},
				complete() {
					wx.hideLoading()
				}
			})
		})
	},
	// aniu 检查session_key 是否过期
	HZCheckSK(session_key, storageKey, checkCB) {
		let that = this;
		let data = {
			'session_key': session_key
		}
		let token = that.jsonSortEnc(data);
		that.HZWxRequest(that.globalData.checkSK_url, '', 'GET', data).then((data) => {
			if (data.errcode === 0) {
				if (typeof checkCB === 'function') {
					checkCB(data.data)
				}
			} else {
				wx.getStorage({
					key: storageKey,
					success: function(res) {
						that.HZGetSK(res.data, that.globalData.getSessionKeyUrl, storageKey, (sk) => {
							that.HZCheckSK(sk, function(info) {
								if (typeof checkCB === 'function') {
									checkCB(info)
								}
							})
						})
					},
				})
			}
		}, (res) => {
			console.log(res)
		})
	},
	// 分享主体随机
	HZArrRandom(arr = shareImg) {
		return arr[Math.floor((Math.random() * arr.length))]
	},
	// 用*号包括
	usernameReplace(username) {
		let len = username.length
		let newName
		if (len >= 3) {
			let num = username.length - 1
			newName = username.replace(username.slice(1, num), '***')
		} else {
			if (username.substr(1) !== '') {
				newName = '*' + username.substr(1)
			} else {
				newName = '***'
			}
		}
		return newName
	},
	usernameFour(str) {
		if (str.length > 4) {
			return str.substring(0, 4) + '*'
		} else {
			return str
		}
	},

	// canvas画布保存到相册
	HZCanvasToPhoto(canvasWidth, canvasHeight, winPro, canvasId) {
		wx.canvasToTempFilePath({
			x: 0,
			y: 0,
			width: canvasWidth,
			height: canvasHeight,
			destWidth: canvasWidth * winPro,
			destHeight: canvasHeight * winPro,
			canvasId: canvasId,
			success: function(res) {
				wx.saveImageToPhotosAlbum({
					filePath: res.tempFilePath,
					success() {
						wx.showToast({
							title: '已保存到您的相册',
							icon: 'success',
							duration: 2000
						})
					}
				})
			}
		})
	},
	// 获取小程序码接口 a、b接口通用 path = 'pages/details/details' todo key设置成默认
	// scene: 'xxx=xxx'
	// 获取scene时 需要 decodeURIComponent(options.scene)
	HZGetCode(scene, path, sk, method, needSK, key = ) {
		let that = this
		return new Promise((resolve, reject) => {
			let data = {
				scene: scene,
				page_path: path,
				width: '258',
				auto_color: '0',
				line_color: '{ "r": "0", "g": "0", "b": "0" }'
			}
			that.HZWxRequest(that.globalData.getCodeBUrl, sk, method, needSK, data).then((data) => {
				if (data.errcode === 0) {
					let qr_url = app.globalData.filePath + res.data.data;
					that.HZDownFile(qr_url).then((currentPath) => {
						resolve(currentPath)
					})
				} else if (r.errcode === 2) {
					that.HZGetNewSK(key).then((SK) => {
						that.HZGetCodeB(id, path, RequestUrl, SK, method, needSK, key)
					})
				} else {
					reject(data)
				}
			}, (data) => {
				wx.showModal({
					title: '温馨提示',
					content: data.errmsg,
					showCancel: false
				})
				reject(data)
			})
		})
	},
	// 下载文件 参数：文件路径
	HZDownFile(xurl) {
		return new Promise((resolve, reject) => {
			wx.downloadFile({
				url: xurl,
				success(res) {
					if (res.statusCode === 200) {
						resolve(res.tempFilePath)
					}
				},
				fail(res) {
					reject(res)
				}
			})
		})
	},
	// 选择照片 参数：照片的张数0-9
	HZChoiceImages(nums) {
		return new Promise((resolve, reject) => {
			wx.chooseImage({
				count: nums,
				sizeType: ['original', 'compressed'],
				sourceType: ['album', 'camera'],
				success(res) {
					resolve(res.tempFilePaths)
				},
				fail(res) {
					reject(res)
				}
			})
		})
	},
	// 预览 
	HZPreviewImage(curUrl, imgArr) {
		wx.previewImage({
			current: curUrl,
			urls: imgArr
		})
	},
	// 拨打电话
	HZCallPhone(num) {
		wx.makePhoneCall({
			phoneNumber: num
		})
	},
	// 新的微信授权 todo scope 设置成默认
	HZWxAuth(scope = ) {
		return new Promise((resolve, reject) => {
			wx.getSetting({
				success: (res) => {
					if (res.authSetting[scope] === undefined) {
						wx.authorize({
							scope: scope,
							success() {
								resolve()
							},
							fail: function() {
								reject()
							}
						})
					} else {
						if (res.authSetting[scope] === true) {
							resolve()
						} else {
							wx.openSetting({
								success(res) {
									if (res.authSetting[scope] === true) {
										resolve()
									} else {
										reject()
									}
								}
							})
						}
					}
				}
			})
		})
	},
	// 范围内随机取值
	HZArrRangeValue(bigNum, smallNum) {
		return Math.floor(Math.random() * (bigNum - smallNum + 1) + smallNum)
	},
	// 判断类型
	getType(obj) {
		//tostring会返回对应不同的标签的构造函数
		let toString = Object.prototype.toString;
		let map = {
			'[object Boolean]': 'boolean',
			'[object Number]': 'number',
			'[object String]': 'string',
			'[object Function]': 'function',
			'[object Array]': 'array',
			'[object Date]': 'date',
			'[object RegExp]': 'regExp',
			'[object Undefined]': 'undefined',
			'[object Null]': 'null',
			'[object Object]': 'object'
		};
		// if (obj instanceof Element) {
		//   return 'element';
		// }
		return map[toString.call(obj)];
	},
	// 深拷贝
	deepClone(data) {
		let that = this
		let _type = that.getType(data);
		let obj;
		if (_type === 'array') {
			obj = [];
		} else if (_type === 'object') {
			obj = {};
		} else {
			//不再具有下一层次
			return data;
		}
		if (_type === 'array') {
			for (let i = 0, len = data.length; i < len; i++) {
				obj.push(that.deepClone(data[i]));
			}
		} else if (_type === 'object') {
			for (let key in data) {
				obj[key] = that.deepClone(data[key]);
			}
		}
		return obj;
	},
	//随机颜色
	HZRandomColor() {
		let rgb = []
		for (let i = 0; i < 3; ++i) {
			let color = Math.floor(Math.random() * 256).toString(16)
			color = color.length == 1 ? '0' + color : color
			rgb.push(color)
		}
		return '#' + rgb.join('')
	},
	// 兼容ios  获取时间戳
	getTs(time) {
		let arr = time.split(/[- :]/),
			_date = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]),
			timeStr = Date.parse(_date)
		return timeStr
	},
	// 不重复随机
	HZArrRandomNoRepeat(curIndex, indexArr, callback) {
		let that = this
		let num = that.HZArrRandom(indexArr)
		if (num !== curIndex) {
			callback(num)
		} else {
			that.HZArrRandomNoRepeat(curIndex, indexArr, callback)
		}
	},
	// 打乱数组顺序
	HZRearrange(arr) {
		let len = arr.length
		for (let i = len - 1; i >= 0; i--) {
			//随机索引值randomIndex是从0-arr.length中随机抽取的
			let randomIndex = Math.floor(Math.random() * (i + 1));
			//下面三句相当于把从数组中随机抽取到的值与当前遍历的值互换位置
			let itemIndex = arr[randomIndex];
			arr[randomIndex] = arr[i];
			arr[i] = itemIndex;
		}
		//每一次的遍历都相当于把从数组中随机抽取（不重复）的一个元素放到数组的最后面（索引顺序为：len-1,len-2,len-3......0）
		return arr;
	},
	// 获取小程序授权情况
	HZGetSetting(scope = 'scope.userInfo') {
		return new Promise(function(resolve, reject) {
			wx.getSetting({
				success(res) {
					let authSetting = res.authSetting
					let length = Object.keys(authSetting)
					if (length === 0) {
						reject()
					} else {
						if (!authSetting[scope]) {
							reject()
						} else {
							resolve()
						}
					}
				}
			})
		})
	},
	// 提交formid
	// 提交表单时
	dealFormIds(formId) {
		let that = this
		let formIds = that.globalData.gloabalFormIds;
		if (!formIds) formIds = [];
		let data = {
			'formId': formId,
			'expire': parseInt(new Date().getTime() / 1000) + 604800
		}
		formIds.push(data);
		that.globalData.gloabalFormIds = formIds;
	},
	// 页面加载时 	todo key设置成默认 
	saveFormIds(key = ) {
		let that = this
		let formIds = that.globalData.gloabalFormIds;
		if (formIds.length) {
			formIds = JSON.stringify(formIds);
			that.globalData.gloabalFormIds = [];
			let sk = that.HZGetStorageSync(key).session_key
			that.saveFormIdsFn(formIds, sk, key)
		}
	},
	// 保存formid todo key设置成默认
	saveFormIdsFn(str, sk, key = ) {
		let that = this
		let data = {
			'datas': str
		}
		that.HZWxRequest(that.globalData.uploadFormIdUrl, sk, 'POST', true, data).then((r) => {
			let code = r.errcode
			if (code === 0) {

			} else if (code === 2) {
				that.HZGetNewSKSync(key).then((SK) => {
					that.saveFormIdsFn(str, SK, key)
				})
			} else {
				// wx.showToast({
				//   title: '暂无法获取数据，请稍后重试',
				//   icon: 'none',
				//   duration: 2000
				// })
			}
		}, (r) => {
			wx.showToast({
				title: '系统出错，请稍后重试',
				icon: 'none',
				duration: 2000
			})
		})
	},
	// 获取对象key的个数
	HZGetKeysNumber(options) {
		let optionsKeys = 0
		for (let optionsKey in options) {
			optionsKeys++
		}
		return optionsKeys
	},
	// 获取storage中的session_key 同步 storageStr设置成默认 todo
	HZGetStorageSync(storageStr = ) {
		let storageData = wx.getStorageSync(storageStr)
		return storageData
	},
	// session_key过期通过storage中的data通过wx.login获取sk 同步 todo storageKey设置成默认
	HZGetNewSKSync(storageKey = ) {
		let that = this
		let info = that.HZGetStorageSync(storageKey)
		return new Promise(function(resolve, reject) {
			that.HZGetSKSync(info, storageKey).then((sk) => {
				resolve(sk)
			}, (r) => {
				reject(r)
			})
		})
	},
	// aniu获取session_key 同步 todo  storageKey 可以弄成默认
	HZGetSKSync(msg, storageKey = ) {
		let that = this;
		return new Promise(function(resolve, reject) {
			let info = {
				'nick_name': msg.nickName,
				'gender': msg.gender,
				'city': msg.city,
				'province': msg.province,
				'country': msg.country,
				'avatar_url': msg.avatarUrl
			}
			wx.login({
				success: function(r) {
					if (r.code) {
						info.code = r.code;
						that.HZWxRequest(that.globalData.getSessionKeyUrl, '', 'GET', false, info).then((res) => {
							let curSk = res.data;
							msg.session_key = curSk
							wx.setStorageSync(storageKey, msg)
							resolve(curSk)
						}, (res) => {
							wx.showModal({
								title: '温馨提示',
								content: data.errmsg,
								showCancel: false
							})
							reject(res)
						})
					} else {
						console.log('登录失败！' + res.errMsg)
						reject(r)
					}
				}
			})
		})
	},
	// 上传照片,参数需要上传的文件 syncStorageKey设置成默认 todo  同步 showloading要加上
	HZUploadFileSync(sk, theFilePath, syncStorageKey = ) {
		let that = this
		return new Promise((resolve, reject) => {
			wx.uploadFile({
				// todo 上传路径
				url: that.globalData.upLoadFileUrl,
				filePath: theFilePath,
				name: 'file',
				header: {
					'content-type': 'application/x-www-form-urlencoded;application/json',
					'session-key': sk
				},
				success(res) {
					let data = res.data;
					let obj = JSON.parse(data)
					if (obj.errcode === 0) {
						// let path = app.globalData.filePath + obj.data.img_name
						resolve(obj.data.img_name)
					} else if (obj.errcode === 2) {
						that.HZGetNewSKSync(syncStorageKey).then((SK) => {
							HZUploadFileSync(SK, theFilePath, syncStorageKey)
						})
					} else {
						reject(res)
						wx.showToast({
							title: obj.errmsg,
							icon: 'none',
							duration: 2000
						})
					}
				},
				fail(res) {
					reject(res)
				},
				complete() {
					wx.hideLoading();
				}
			})
		})
	},
	// 保存图片 todo storageStr设置成默认 同步
	HZSaveImgSync(canvasIsOver, width, height, winPro, id, storageStr = ) {
		let that = this
		if (canvasIsOver) {
			let data = that.HZGetStorageSync(storageStr)
			if (!data.photo) {
				that.HZWxAuth('scope.writePhotosAlbum').then(() => {
					that.HZCanvasToPhoto(width, height, winPro, id)
					data.photo = true
					wx.setStorageSync(storageStr, data)
				}, () => {
					wx.setStorageSync(storageStr, data)
				})
			} else {
				that.HZCanvasToPhoto(width, height, winPro, id)
			}
		} else {
			wx.showModal({
				title: '温馨提示',
				content: '照片生成中，请稍后再点击',
				showCancel: false
			})
		}
	},
	// 保存图片 todo storageStr设置成默认
	HZSaveImg(canvasIsOver, width, height, winPro, id, storageStr = ) {
		let that = this
		if (canvasIsOver) {
			wx.getStorage({
				key: storageStr,
				success: function(res) {
					let data = res.data
					if (!data.photo) {
						that.HZWxAuth('scope.writePhotosAlbum').then(() => {
							that.HZCanvasToPhoto(width, height, winPro, id)
							data.photo = true
							wx.setStorage({
								key: storageStr,
								data: data
							})
						}, () => {
							data.photo = false
							wx.setStorage({
								key: storageStr,
								data: data
							})
						})
					} else {
						that.HZCanvasToPhoto(width, height, winPro, id)
					}
				},
			})
		} else {
			wx.showModal({
				title: '温馨提示',
				content: '照片生成中，请稍后再点击',
				showCancel: false
			})
		}
	},
	// 上传照片,参数需要上传的文件 storageKey设置成默认 todo wx.showloading记得加上去
	HZUploadFile(sk, theFilePath, storageKey = ) {
		let that = this
		return new Promise((resolve, reject) => {
			wx.uploadFile({
				// todo 上传路径
				url: that.globalData.upLoadFileUrl,
				filePath: theFilePath,
				name: 'file',
				header: {
					'content-type': 'application/x-www-form-urlencoded;application/json',
					'session-key': sk
				},
				success(res) {
					let data = res.data;
					let obj = JSON.parse(data)
					if (obj.errcode === 0) {
						// let path = app.globalData.filePath + obj.data.img_name
						resolve(obj.data.img_name)
					} else if (obj.errcode === 2) {
						that.HZGetNewSK(storageKey).then((SK) => {
							that.HZUploadFile(SK, theFilePath, storageKey)
						})
					} else {
						reject(res)
						wx.showToast({
							title: obj.errmsg,
							icon: 'none',
							duration: 2000
						})
					}
				},
				fail(res) {
					reject(res)
				},
				complete() {
					wx.hideLoading();
				}
			})
		})
	},
	// aniu获取session_key todo storageKey设置默认
	HZGetSK(msg, storageKey = ) {
		let that = this;
		return new Promise((resolve, reject) => {
			let info = {
				'nick_name': msg.nickName,
				'gender': msg.gender,
				'city': msg.city,
				'province': msg.province,
				'country': msg.country,
				'avatar_url': msg.avatarUrl
			}
			wx.login({
				success: function(r) {
					if (r.code) {
						info.code = r.code;
						that.HZWxRequest(that.globalData.getSessionKeyUrl, '', 'GET', false, info).then((res) => {
							let curSk = res.data
							resolve(curSk)
							msg.session_key = curSk
							wx.setStorage({
								key: storageKey,
								data: msg
							})
						}, (res) => {
							reject(res)
							wx.showModal({
								title: '温馨提示',
								content: res.errmsg,
								showCancel: false
							})
						})
					} else {
						reject(r)
					}
				}
			})
		})
	},
	// session_key过期通过storage中的data通过wx.login获取sk
	// storageKey设置成默认
	HZGetNewSK(storageKey = ) {
		let that = this
		return new Promise((resolve, reject) => {
			wx.getStorage({
				key: storageKey,
				success(res) {
					let info = res.data
					that.HZGetSK(info).then((sk) => {
						resolve(sk)
					}, (r) => {
						reject(r)
					})
				},
				fail(res) {
					reject(res)
				}
			})
		})
	},
	// 获取storage中的session_key todo storageStr设置成默认
	HZGetStorageSK(storageStr = ) {
		return new Promise((resolve, reject) => {
			wx.getStorage({
				key: storageStr,
				success(res) {
					resolve(res.data.session_key)
				},
				fail(res) {
					reject(res)
				}
			})
		})
	},
	// 获取多个随机数
	HZGetArrayItems(arr, num) {
		let temp_array = new Array()
		for (let index in arr) {
			temp_array.push(arr[index])
		}
		let return_array = new Array()
		for (let i = 0; i < num; i++) {
			if (temp_array.length > 0) {
				let arrIndex = Math.floor(Math.random() * temp_array.length)
				return_array[i] = temp_array[arrIndex]
				temp_array.splice(arrIndex, 1)
			} else {
				break
			}
		}
		return return_array
	},
	// 数组去从
	HZArrOutRepeat(arr) {
		let hashTable = {},
			data = []
		for (let i = 0; i < arr.length; i++) {
			if (!hashTable[arr[i]]) {
				hashTable[arr[i]] = true
				data.push(arr[i])
			}
		}
		return data
	},
	// 字符串出现字数最多的字符
	HZStrMaxRepeat(str) {
		if (str.length == 1) {
			return str
		}
		let charObj = {}, maxChar = '', maxValue = ''
		for (let i = 0; i < str.length; i++) {
			// charobj 里面放次数
			if (!charObj[str.charAt(i)]) {
				charObj[str.charAt(i)] = 1
			} else {
				charObj[str.charAt(i)] += 1
			}
		}
		for (let k in charObj) {
			if (charObj[k] >= maxValue) {
				maxChar = k
				maxValue = charObj[k]
			}
		}
		return maxChar
	}
	// 授权 遗弃
	//   HZWxAuth(scope, isOpen, suc, fail) {
	//   	wx.getSetting({
	//   		success(res) {
	//   			if (!res.authSetting[scope]) {
	//   				if (isOpen === false) {
	//   					wx.authorize({
	//   						scope: scope,
	//   						success() {
	//   							if (typeof suc === 'function') {
	//   								suc();
	//   							}
	//   						},
	//   						fail: function() {
	//   							if (typeof fail === 'function') {
	//   								fail();
	//   							}
	//   						}
	//   					})
	//   				} else {
	//   					wx.openSetting({
	//   						success(res) {
	//   							if (res.authSetting[scope] === true) {
	//   								if (typeof suc === 'function') {
	//   									suc();
	//   								}
	//   							} else {
	//   								if (typeof fail === 'function') {
	//   									fail();
	//   								}
	//   							}
	//   						}
	//   					})
	//   				}
	//   			} else {
	//   				if (typeof suc === 'function') {
	//   					suc();
	//   				}
	//   			}
	//   		},
	//   		fail: function() {
	//   			console.log(11)
	//   		}
	//   	})
	//   }
})
