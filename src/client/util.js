export function isiOSApp () {
  return window.navigator.userAgent.indexOf('Hylo-App') > -1
}

export function isAndroidApp () {
  return typeof AndroidBridge !== 'undefined'
}

/* usage:
 * var connectWebViewJavascriptBridge = require('webViewJavascriptBridge')
 * connectWebViewJavascriptBridge(function(bridge) {
 *   bridge.send(...)
 * }
 */
export function connectWebViewBridge (callback) {
  if (window.WebViewJavascriptBridge) {
    callback(window.WebViewJavascriptBridge)
  } else {
    document.addEventListener('WebViewJavascriptBridgeReady', function () {
      callback(window.WebViewJavascriptBridge)
    }, false)
  }
}