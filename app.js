//app.js
App({
	onLaunch: function () {

	},
	globalData: {
		userInfo: null
	},
	// es6微信请求
	HZWxRequest(xurl, sk, method, needSK, data = {}) {
		let that = this
		let token = that.jsonSortEnc(data)
		wx.showLoading({
			title: '加载中',
			mask: true
		})
		let headerObj = {}
		if (needSK === true) {
			headerObj = {
				'content-type': 'application/x-www-form-urlencoded;application/json',
				'token': token,
				'session-key': sk
			}
		} else {
			headerObj = {
				'content-type': 'application/x-www-form-urlencoded;application/json',
				'token': token
			}
		}
		return new Promise(function (resolve, reject) {
			wx.request({
				url: xurl,
				data: data,
				method: method,
				header: headerObj,
				success: function (res) {
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
	// aniu获取session_key
	HZGetSK(msg, getSKUrl, storageKey, get_callback) {
		let that = this;
		let info = {
			'nick_name': msg.nickName,
			'gender': msg.gender,
			'city': msg.city,
			'province': msg.province,
			'country': msg.country,
			'avatar_url': msg.avatarUrl
		}
		wx.login({
			success: function (res) {
				if (res.code) {
					info.code = res.code;
					that.HZWxRequest(getSKUrl, '', 'GET', false, info).then((res) => {
						let curSk = res.data;
						if (typeof get_callback === "function") {
							get_callback(curSk)
						}
						let cur_second = (new Date()).getTime()
						let num = parseInt(cur_second / 1000)
						msg.time = num
						msg.session_key = curSk
						wx.setStorage({
							key: storageKey,
							data: msg
						})
					}, (res) => {
						wx.showModal({
							title: '温馨提示',
							content: data.errmsg,
							showCancel: false
						})
					})
				} else {
					console.log('登录失败！' + res.errMsg)
				}
			}
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
					success: function (res) {
						that.HZGetSK(res.data, getSKUrl, storageKey, (sk) => {
							that.HZCheckSK(sk, function (info) {
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
	// session_key过期通过storage中的data通过wx.login获取sk
	HZGetNewSK(storageKey, getSKUrl, callback) {
		let that = this
		wx.getStorage({
			key: storageKey,
			success: function (res) {
				let info = res.data
				that.HZGetSK(info, getSKUrl, storageKey, (sk) => {
					if (typeof callback === 'function') {
						callback(sk)
					}
				})
			},
		})
	},
	// 获取storage中的session_key
	HZGetStorageSK(storageStr, callback) {
		wx.getStorage({
			key: storageStr,
			success: function (res) {
				if (typeof callback === 'function') {
					callback(res.data.session_key)
				}
			}
		})
	},
	// 授权
	HZWxAuth(scope, isOpen, suc, fail) {
		wx.getSetting({
			success(res) {
				if (!res.authSetting[scope]) {
					if (isOpen === false) {
						wx.authorize({
							scope: scope,
							success() {
								if (typeof suc === 'function') {
									suc();
								}
							},
							fail: function () {
								if (typeof fail === 'function') {
									fail();
								}
							}
						})
					} else {
						wx.openSetting({
							success(res) {
								if (res.authSetting[scope] === true) {
									if (typeof suc === 'function') {
										suc();
									}
								} else {
									if (typeof fail === 'function') {
										fail();
									}
								}
							}
						})
					}
				} else {
					if (typeof suc === 'function') {
						suc();
					}
				}
			},
			fail: function () {
				console.log(11)
			}
		})
	},
	// 保存图片
	HZSaveImg(canvasIsOver, storageStr, width, height, winPro, id) {
		let that = this
		if (canvasIsOver) {
			wx.getStorage({
				key: storageStr,
				success: function (res) {
					let data = res.data
					if (data.photo === undefined) {
						that.HZWxAuth('scope.writePhotosAlbum', false, () => {
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
					} else if (data.photo === false) {
						that.HZWxAuth('scope.writePhotosAlbum', true, () => {
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
	// canvas画布保存到相册
	HZHZCanvasToPhoto(canvasWidth, canvasHeight, winPro, canvasId) {
		wx.canvasToTempFilePath({
			x: 0,
			y: 0,
			width: canvasWidth,
			height: canvasHeight,
			destWidth: canvasWidth * winPro,
			destHeight: canvasHeight * winPro,
			canvasId: canvasId,
			success: function (res) {
				wx.saveImageToPhotosAlbum({
					filePath: res.tempFilePath,
					success() {
						wx.showModal({
							title: '温馨提示',
							content: '已保存到您的相册',
							showCancel: false
						})
					}
				})
			}
		})
	},
	// 获取小程序码接口B path = 'pages/details/details'
	HZGetCodeB(id, path, RequestUrl, sk, method, needSK, callback) {
		let that = this
		let data = {
			scene: 'id=' + id,
			page_path: path,
			width: '258',
			auto_color: '0',
			line_color: '{ "r": "0", "g": "0", "b": "0" }'
		}
		that.HZWxRequest(RequestUrl, sk, method, needSK, data).then((data) => {
			if (data.errcode === 0) {
				let qr_url = app.globalData.get_files_url + res.data.data;
				wx.downloadFile({
					url: qr_url,
					success: function (res) {
						if (res.statusCode === 200) {
							let qrUrl = res.tempFilePath;
							if (typeof callback == 'function') {
								callback(qrUrl)
							}
						}
					}
				})
			}
		}, (data) => {
			wx.showModal({
				title: '温馨提示',
				content: data.errmsg,
				showCancel: false
			})
		})
	},
	// 下载文件 参数：文件路径、回调函数
	HZDownFile(xurl, callback) {
		wx.downloadFile({
			url: xurl,
			success: function (res) {
				if (res.statusCode === 200) {
					let path = res.tempFilePath
					if (typeof callback === 'function') {
						callback(path)
					}
				}
			}
		})
	},
	// 选择图片  图片张数、回调函数（数组）
	HZChoiceImages(nums, callback) {
		wx.chooseImage({
			count: nums,
			sizeType: ['original', 'compressed'],
			sourceType: ['album', 'camera'],
			success: function (res) {
				let tempFilePaths = res.tempFilePaths
				if (typeof callback === 'function') {
					callback(tempFilePaths)
				}
			}
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
	// 新的微信授权
	HZWxAuthV2(scope, suc, fail) {
		wx.getSetting({
			success: (res) => {
				if (res.authSetting[scope] === undefined) {
					wx.authorize({
						scope: scope,
						success() {
							if (typeof suc === 'function') {
								suc();
							}
						},
						fail: function () {
							if (typeof fail === 'function') {
								fail();
							}
						}
					})
				} else {
					if (res.authSetting[scope] === true) {
						if (typeof suc === 'function') {
							suc();
						}
					} else {
						wx.openSetting({
							success(res) {
								if (res.authSetting[scope] === true) {
									if (typeof suc === 'function') {
										suc();
									}
								} else {
									if (typeof fail === 'function') {
										fail();
									}
								}
							}
						})
					}
				}
			}
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
		if (obj instanceof Element) {
			return 'element';
		}
		return map[toString.call(obj)];
	},
	// 深拷贝
	deepClone(data) {
		let type = getType(data);
		let obj;
		if (type === 'array') {
			obj = [];
		} else if (type === 'object') {
			obj = {};
		} else {
			//不再具有下一层次
			return data;
		}
		if (type === 'array') {
			for (let i = 0, len = data.length; i < len; i++) {
				obj.push(deepClone(data[i]));
			}
		} else if (type === 'object') {
			for (let key in data) {
				obj[key] = deepClone(data[key]);
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
	}
})
