// Built version of fake-indexeddb using Browserify
// browserify -r fake-indexeddb -s FakeIndexedDB
// Also patched to expose FDBKeyRange
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.FakeIndexedDB = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":4,"timers":5}],6:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var FDBKeyRange_1 = require("./FDBKeyRange");
window.FDBKeyRange = FDBKeyRange_1.default;
var FDBObjectStore_1 = require("./FDBObjectStore");
var cmp_1 = require("./lib/cmp");
var errors_1 = require("./lib/errors");
var extractKey_1 = require("./lib/extractKey");
var structuredClone_1 = require("./lib/structuredClone");
var valueToKey_1 = require("./lib/valueToKey");
var getEffectiveObjectStore = function (cursor) {
    if (cursor.source instanceof FDBObjectStore_1.default) {
        return cursor.source;
    }
    return cursor.source.objectStore;
};
// This takes a key range, a list of lower bounds, and a list of upper bounds and combines them all into a single key
// range. It does not handle gt/gte distinctions, because it doesn't really matter much anyway, since for next/prev
// cursor iteration it'd also have to look at values to be precise, which would be complicated. This should get us 99%
// of the way there.
var makeKeyRange = function (range, lowers, uppers) {
    var e_1, _a, e_2, _b;
    // Start with bounds from range
    var lower = range !== undefined ? range.lower : undefined;
    var upper = range !== undefined ? range.upper : undefined;
    try {
        // Augment with values from lowers and uppers
        for (var lowers_1 = __values(lowers), lowers_1_1 = lowers_1.next(); !lowers_1_1.done; lowers_1_1 = lowers_1.next()) {
            var lowerTemp = lowers_1_1.value;
            if (lowerTemp === undefined) {
                continue;
            }
            if (lower === undefined || cmp_1.default(lower, lowerTemp) === 1) {
                lower = lowerTemp;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (lowers_1_1 && !lowers_1_1.done && (_a = lowers_1.return)) _a.call(lowers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        for (var uppers_1 = __values(uppers), uppers_1_1 = uppers_1.next(); !uppers_1_1.done; uppers_1_1 = uppers_1.next()) {
            var upperTemp = uppers_1_1.value;
            if (upperTemp === undefined) {
                continue;
            }
            if (upper === undefined || cmp_1.default(upper, upperTemp) === -1) {
                upper = upperTemp;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (uppers_1_1 && !uppers_1_1.done && (_b = uppers_1.return)) _b.call(uppers_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    if (lower !== undefined && upper !== undefined) {
        return FDBKeyRange_1.default.bound(lower, upper);
    }
    if (lower !== undefined) {
        return FDBKeyRange_1.default.lowerBound(lower);
    }
    if (upper !== undefined) {
        return FDBKeyRange_1.default.upperBound(upper);
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#cursor
var FDBCursor = /** @class */ (function () {
    function FDBCursor(source, range, direction, request, keyOnly) {
        if (direction === void 0) { direction = "next"; }
        if (keyOnly === void 0) { keyOnly = false; }
        this._gotValue = false;
        this._position = undefined; // Key of previously returned record
        this._objectStorePosition = undefined;
        this._keyOnly = false;
        this._key = undefined;
        this._primaryKey = undefined;
        this._range = range;
        this._source = source;
        this._direction = direction;
        this._request = request;
        this._keyOnly = keyOnly;
    }
    Object.defineProperty(FDBCursor.prototype, "source", {
        // Read only properties
        get: function () {
            return this._source;
        },
        set: function (val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FDBCursor.prototype, "direction", {
        get: function () {
            return this._direction;
        },
        set: function (val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FDBCursor.prototype, "key", {
        get: function () {
            return this._key;
        },
        set: function (val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FDBCursor.prototype, "primaryKey", {
        get: function () {
            return this._primaryKey;
        },
        set: function (val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true
    });
    // https://w3c.github.io/IndexedDB/#iterate-a-cursor
    FDBCursor.prototype._iterate = function (key, primaryKey) {
        var e_3, _a, e_4, _b, e_5, _c, e_6, _d;
        var sourceIsObjectStore = this.source instanceof FDBObjectStore_1.default;
        // Can't use sourceIsObjectStore because TypeScript
        var records = this.source instanceof FDBObjectStore_1.default
            ? this.source._rawObjectStore.records
            : this.source._rawIndex.records;
        var foundRecord;
        if (this.direction === "next") {
            var range = makeKeyRange(this._range, [key, this._position], []);
            try {
                for (var _e = __values(records.values(range)), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var record = _f.value;
                    var cmpResultKey = key !== undefined ? cmp_1.default(record.key, key) : undefined;
                    var cmpResultPosition = this._position !== undefined
                        ? cmp_1.default(record.key, this._position)
                        : undefined;
                    if (key !== undefined) {
                        if (cmpResultKey === -1) {
                            continue;
                        }
                    }
                    if (primaryKey !== undefined) {
                        if (cmpResultKey === -1) {
                            continue;
                        }
                        var cmpResultPrimaryKey = cmp_1.default(record.value, primaryKey);
                        if (cmpResultKey === 0 && cmpResultPrimaryKey === -1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && sourceIsObjectStore) {
                        if (cmpResultPosition !== 1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && !sourceIsObjectStore) {
                        if (cmpResultPosition === -1) {
                            continue;
                        }
                        if (cmpResultPosition === 0 &&
                            cmp_1.default(record.value, this._objectStorePosition) !== 1) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    foundRecord = record;
                    break;
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        else if (this.direction === "nextunique") {
            // This could be done without iterating, if the range was defined slightly better (to handle gt/gte cases).
            // But the performance difference should be small, and that wouldn't work anyway for directions where the
            // value needs to be used (like next and prev).
            var range = makeKeyRange(this._range, [key, this._position], []);
            try {
                for (var _g = __values(records.values(range)), _h = _g.next(); !_h.done; _h = _g.next()) {
                    var record = _h.value;
                    if (key !== undefined) {
                        if (cmp_1.default(record.key, key) === -1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined) {
                        if (cmp_1.default(record.key, this._position) !== 1) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    foundRecord = record;
                    break;
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        else if (this.direction === "prev") {
            var range = makeKeyRange(this._range, [], [key, this._position]);
            try {
                for (var _j = __values(records.values(range, "prev")), _k = _j.next(); !_k.done; _k = _j.next()) {
                    var record = _k.value;
                    var cmpResultKey = key !== undefined ? cmp_1.default(record.key, key) : undefined;
                    var cmpResultPosition = this._position !== undefined
                        ? cmp_1.default(record.key, this._position)
                        : undefined;
                    if (key !== undefined) {
                        if (cmpResultKey === 1) {
                            continue;
                        }
                    }
                    if (primaryKey !== undefined) {
                        if (cmpResultKey === 1) {
                            continue;
                        }
                        var cmpResultPrimaryKey = cmp_1.default(record.value, primaryKey);
                        if (cmpResultKey === 0 && cmpResultPrimaryKey === 1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && sourceIsObjectStore) {
                        if (cmpResultPosition !== -1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && !sourceIsObjectStore) {
                        if (cmpResultPosition === 1) {
                            continue;
                        }
                        if (cmpResultPosition === 0 &&
                            cmp_1.default(record.value, this._objectStorePosition) !== -1) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    foundRecord = record;
                    break;
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
                }
                finally { if (e_5) throw e_5.error; }
            }
        }
        else if (this.direction === "prevunique") {
            var tempRecord = void 0;
            var range = makeKeyRange(this._range, [], [key, this._position]);
            try {
                for (var _l = __values(records.values(range, "prev")), _m = _l.next(); !_m.done; _m = _l.next()) {
                    var record = _m.value;
                    if (key !== undefined) {
                        if (cmp_1.default(record.key, key) === 1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined) {
                        if (cmp_1.default(record.key, this._position) !== -1) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    tempRecord = record;
                    break;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_m && !_m.done && (_d = _l.return)) _d.call(_l);
                }
                finally { if (e_6) throw e_6.error; }
            }
            if (tempRecord) {
                foundRecord = records.get(tempRecord.key);
            }
        }
        var result;
        if (!foundRecord) {
            this._key = undefined;
            if (!sourceIsObjectStore) {
                this._objectStorePosition = undefined;
            }
            // "this instanceof FDBCursorWithValue" would be better and not require (this as any), but causes runtime
            // error due to circular dependency.
            if (!this._keyOnly &&
                this.constructor.name === "FDBCursorWithValue") {
                this.value = undefined;
            }
            result = null;
        }
        else {
            this._position = foundRecord.key;
            if (!sourceIsObjectStore) {
                this._objectStorePosition = foundRecord.value;
            }
            this._key = foundRecord.key;
            if (sourceIsObjectStore) {
                this._primaryKey = structuredClone_1.default(foundRecord.key);
                if (!this._keyOnly &&
                    this.constructor.name === "FDBCursorWithValue") {
                    this.value = structuredClone_1.default(foundRecord.value);
                }
            }
            else {
                this._primaryKey = structuredClone_1.default(foundRecord.value);
                if (!this._keyOnly &&
                    this.constructor.name === "FDBCursorWithValue") {
                    if (this.source instanceof FDBObjectStore_1.default) {
                        // Can't use sourceIsObjectStore because TypeScript
                        throw new Error("This should never happen");
                    }
                    var value = this.source.objectStore._rawObjectStore.getValue(foundRecord.value);
                    this.value = structuredClone_1.default(value);
                }
            }
            this._gotValue = true;
            result = this;
        }
        return result;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-update-IDBRequest-any-value
    FDBCursor.prototype.update = function (value) {
        if (value === undefined) {
            throw new TypeError();
        }
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty("_rawIndex")
            ? this.primaryKey
            : this._position;
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue || !this.hasOwnProperty("value")) {
            throw new errors_1.InvalidStateError();
        }
        var clone = structuredClone_1.default(value);
        if (effectiveObjectStore.keyPath !== null) {
            var tempKey = void 0;
            try {
                tempKey = extractKey_1.default(effectiveObjectStore.keyPath, clone);
            }
            catch (err) {
                /* Handled immediately below */
            }
            if (cmp_1.default(tempKey, effectiveKey) !== 0) {
                throw new errors_1.DataError();
            }
        }
        var record = {
            key: effectiveKey,
            value: clone,
        };
        return transaction._execRequestAsync({
            operation: effectiveObjectStore._rawObjectStore.storeRecord.bind(effectiveObjectStore._rawObjectStore, record, false, transaction._rollbackLog),
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-advance-void-unsigned-long-count
    FDBCursor.prototype.advance = function (count) {
        var _this = this;
        if (!Number.isInteger(count) || count <= 0) {
            throw new TypeError();
        }
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue) {
            throw new errors_1.InvalidStateError();
        }
        if (this._request) {
            this._request.readyState = "pending";
        }
        transaction._execRequestAsync({
            operation: function () {
                var result;
                for (var i = 0; i < count; i++) {
                    result = _this._iterate();
                    // Not sure why this is needed
                    if (!result) {
                        break;
                    }
                }
                return result;
            },
            request: this._request,
            source: this.source,
        });
        this._gotValue = false;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-continue-void-any-key
    FDBCursor.prototype.continue = function (key) {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue) {
            throw new errors_1.InvalidStateError();
        }
        if (key !== undefined) {
            key = valueToKey_1.default(key);
            var cmpResult = cmp_1.default(key, this._position);
            if ((cmpResult <= 0 &&
                (this.direction === "next" ||
                    this.direction === "nextunique")) ||
                (cmpResult >= 0 &&
                    (this.direction === "prev" ||
                        this.direction === "prevunique"))) {
                throw new errors_1.DataError();
            }
        }
        if (this._request) {
            this._request.readyState = "pending";
        }
        transaction._execRequestAsync({
            operation: this._iterate.bind(this, key),
            request: this._request,
            source: this.source,
        });
        this._gotValue = false;
    };
    // hthttps://w3c.github.io/IndexedDB/#dom-idbcursor-continueprimarykey
    FDBCursor.prototype.continuePrimaryKey = function (key, primaryKey) {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (this.source instanceof FDBObjectStore_1.default ||
            (this.direction !== "next" && this.direction !== "prev")) {
            throw new errors_1.InvalidAccessError();
        }
        if (!this._gotValue) {
            throw new errors_1.InvalidStateError();
        }
        // Not sure about this
        if (key === undefined || primaryKey === undefined) {
            throw new errors_1.DataError();
        }
        key = valueToKey_1.default(key);
        var cmpResult = cmp_1.default(key, this._position);
        if ((cmpResult === -1 && this.direction === "next") ||
            (cmpResult === 1 && this.direction === "prev")) {
            throw new errors_1.DataError();
        }
        var cmpResult2 = cmp_1.default(primaryKey, this._objectStorePosition);
        if (cmpResult === 0) {
            if ((cmpResult2 <= 0 && this.direction === "next") ||
                (cmpResult2 >= 0 && this.direction === "prev")) {
                throw new errors_1.DataError();
            }
        }
        if (this._request) {
            this._request.readyState = "pending";
        }
        transaction._execRequestAsync({
            operation: this._iterate.bind(this, key, primaryKey),
            request: this._request,
            source: this.source,
        });
        this._gotValue = false;
    };
    FDBCursor.prototype.delete = function () {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty("_rawIndex")
            ? this.primaryKey
            : this._position;
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue || !this.hasOwnProperty("value")) {
            throw new errors_1.InvalidStateError();
        }
        return transaction._execRequestAsync({
            operation: effectiveObjectStore._rawObjectStore.deleteRecord.bind(effectiveObjectStore._rawObjectStore, effectiveKey, transaction._rollbackLog),
            source: this,
        });
    };
    FDBCursor.prototype.toString = function () {
        return "[object IDBCursor]";
    };
    return FDBCursor;
}());
exports.default = FDBCursor;

},{"./FDBKeyRange":11,"./FDBObjectStore":12,"./lib/cmp":27,"./lib/errors":29,"./lib/extractKey":30,"./lib/structuredClone":32,"./lib/valueToKey":34}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FDBCursor_1 = require("./FDBCursor");
var FDBCursorWithValue = /** @class */ (function (_super) {
    __extends(FDBCursorWithValue, _super);
    function FDBCursorWithValue(source, range, direction, request) {
        var _this = _super.call(this, source, range, direction, request) || this;
        _this.value = undefined;
        return _this;
    }
    FDBCursorWithValue.prototype.toString = function () {
        return "[object IDBCursorWithValue]";
    };
    return FDBCursorWithValue;
}(FDBCursor_1.default));
exports.default = FDBCursorWithValue;

},{"./FDBCursor":6}],8:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var FDBTransaction_1 = require("./FDBTransaction");
var errors_1 = require("./lib/errors");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var FakeEventTarget_1 = require("./lib/FakeEventTarget");
var ObjectStore_1 = require("./lib/ObjectStore");
var validateKeyPath_1 = require("./lib/validateKeyPath");
var confirmActiveVersionchangeTransaction = function (database) {
    if (!database._runningVersionchangeTransaction) {
        throw new errors_1.InvalidStateError();
    }
    // Find the latest versionchange transaction
    var transactions = database._rawDatabase.transactions.filter(function (tx) {
        return tx.mode === "versionchange";
    });
    var transaction = transactions[transactions.length - 1];
    if (!transaction || transaction._state === "finished") {
        throw new errors_1.InvalidStateError();
    }
    if (transaction._state !== "active") {
        throw new errors_1.TransactionInactiveError();
    }
    return transaction;
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-closing-steps
var closeConnection = function (connection) {
    connection._closePending = true;
    var transactionsComplete = connection._rawDatabase.transactions.every(function (transaction) {
        return transaction._state === "finished";
    });
    if (transactionsComplete) {
        connection._closed = true;
        connection._rawDatabase.connections = connection._rawDatabase.connections.filter(function (otherConnection) {
            return connection !== otherConnection;
        });
    }
    else {
        setImmediate(function () {
            closeConnection(connection);
        });
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-interface
var FDBDatabase = /** @class */ (function (_super) {
    __extends(FDBDatabase, _super);
    function FDBDatabase(rawDatabase) {
        var _this = _super.call(this) || this;
        _this._closePending = false;
        _this._closed = false;
        _this._runningVersionchangeTransaction = false;
        _this._rawDatabase = rawDatabase;
        _this._rawDatabase.connections.push(_this);
        _this.name = rawDatabase.name;
        _this.version = rawDatabase.version;
        _this.objectStoreNames = fakeDOMStringList_1.default(Array.from(rawDatabase.rawObjectStores.keys())).sort();
        return _this;
    }
    // http://w3c.github.io/IndexedDB/#dom-idbdatabase-createobjectstore
    FDBDatabase.prototype.createObjectStore = function (name, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (name === undefined) {
            throw new TypeError();
        }
        var transaction = confirmActiveVersionchangeTransaction(this);
        var keyPath = options !== null && options.keyPath !== undefined
            ? options.keyPath
            : null;
        var autoIncrement = options !== null && options.autoIncrement !== undefined
            ? options.autoIncrement
            : false;
        if (keyPath !== null) {
            validateKeyPath_1.default(keyPath);
        }
        if (this._rawDatabase.rawObjectStores.has(name)) {
            throw new errors_1.ConstraintError();
        }
        if (autoIncrement && (keyPath === "" || Array.isArray(keyPath))) {
            throw new errors_1.InvalidAccessError();
        }
        var objectStoreNames = this.objectStoreNames.slice();
        transaction._rollbackLog.push(function () {
            var objectStore = _this._rawDatabase.rawObjectStores.get(name);
            if (objectStore) {
                objectStore.deleted = true;
            }
            _this.objectStoreNames = fakeDOMStringList_1.default(objectStoreNames);
            transaction._scope.delete(name);
            _this._rawDatabase.rawObjectStores.delete(name);
        });
        var rawObjectStore = new ObjectStore_1.default(this._rawDatabase, name, keyPath, autoIncrement);
        this.objectStoreNames.push(name);
        this.objectStoreNames.sort();
        transaction._scope.add(name);
        this._rawDatabase.rawObjectStores.set(name, rawObjectStore);
        transaction.objectStoreNames = fakeDOMStringList_1.default(this.objectStoreNames.slice());
        return transaction.objectStore(name);
    };
    FDBDatabase.prototype.deleteObjectStore = function (name) {
        var _this = this;
        if (name === undefined) {
            throw new TypeError();
        }
        var transaction = confirmActiveVersionchangeTransaction(this);
        var store = this._rawDatabase.rawObjectStores.get(name);
        if (store === undefined) {
            throw new errors_1.NotFoundError();
        }
        this.objectStoreNames = fakeDOMStringList_1.default(this.objectStoreNames.filter(function (objectStoreName) {
            return objectStoreName !== name;
        }));
        transaction.objectStoreNames = fakeDOMStringList_1.default(this.objectStoreNames.slice());
        transaction._rollbackLog.push(function () {
            store.deleted = false;
            _this._rawDatabase.rawObjectStores.set(name, store);
            _this.objectStoreNames.push(name);
            _this.objectStoreNames.sort();
        });
        store.deleted = true;
        this._rawDatabase.rawObjectStores.delete(name);
        transaction._objectStoresCache.delete(name);
    };
    FDBDatabase.prototype.transaction = function (storeNames, mode) {
        var e_1, _a;
        var _this = this;
        mode = mode !== undefined ? mode : "readonly";
        if (mode !== "readonly" &&
            mode !== "readwrite" &&
            mode !== "versionchange") {
            throw new TypeError("Invalid mode: " + mode);
        }
        var hasActiveVersionchange = this._rawDatabase.transactions.some(function (transaction) {
            return (transaction._state === "active" &&
                transaction.mode === "versionchange" &&
                transaction.db === _this);
        });
        if (hasActiveVersionchange) {
            throw new errors_1.InvalidStateError();
        }
        if (this._closePending) {
            throw new errors_1.InvalidStateError();
        }
        if (!Array.isArray(storeNames)) {
            storeNames = [storeNames];
        }
        if (storeNames.length === 0 && mode !== "versionchange") {
            throw new errors_1.InvalidAccessError();
        }
        try {
            for (var storeNames_1 = __values(storeNames), storeNames_1_1 = storeNames_1.next(); !storeNames_1_1.done; storeNames_1_1 = storeNames_1.next()) {
                var storeName = storeNames_1_1.value;
                if (this.objectStoreNames.indexOf(storeName) < 0) {
                    throw new errors_1.NotFoundError("No objectStore named " + storeName + " in this database");
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (storeNames_1_1 && !storeNames_1_1.done && (_a = storeNames_1.return)) _a.call(storeNames_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var tx = new FDBTransaction_1.default(storeNames, mode, this);
        this._rawDatabase.transactions.push(tx);
        this._rawDatabase.processTransactions(); // See if can start right away (async)
        return tx;
    };
    FDBDatabase.prototype.close = function () {
        closeConnection(this);
    };
    FDBDatabase.prototype.toString = function () {
        return "[object IDBDatabase]";
    };
    return FDBDatabase;
}(FakeEventTarget_1.default));
exports.default = FDBDatabase;

}).call(this)}).call(this,require("timers").setImmediate)
},{"./FDBTransaction":15,"./lib/FakeEventTarget":20,"./lib/ObjectStore":23,"./lib/errors":29,"./lib/fakeDOMStringList":31,"./lib/validateKeyPath":33,"timers":5}],9:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("setimmediate");
var FDBDatabase_1 = require("./FDBDatabase");
var FDBOpenDBRequest_1 = require("./FDBOpenDBRequest");
var FDBVersionChangeEvent_1 = require("./FDBVersionChangeEvent");
var cmp_1 = require("./lib/cmp");
var Database_1 = require("./lib/Database");
var enforceRange_1 = require("./lib/enforceRange");
var errors_1 = require("./lib/errors");
var FakeEvent_1 = require("./lib/FakeEvent");
var waitForOthersClosedDelete = function (databases, name, openDatabases, cb) {
    var anyOpen = openDatabases.some(function (openDatabase2) {
        return !openDatabase2._closed && !openDatabase2._closePending;
    });
    if (anyOpen) {
        setImmediate(function () {
            return waitForOthersClosedDelete(databases, name, openDatabases, cb);
        });
        return;
    }
    databases.delete(name);
    cb(null);
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-a-database
var deleteDatabase = function (databases, name, request, cb) {
    var e_1, _a;
    try {
        var db = databases.get(name);
        if (db === undefined) {
            cb(null);
            return;
        }
        db.deletePending = true;
        var openDatabases = db.connections.filter(function (connection) {
            return !connection._closed && !connection._closePending;
        });
        try {
            for (var openDatabases_1 = __values(openDatabases), openDatabases_1_1 = openDatabases_1.next(); !openDatabases_1_1.done; openDatabases_1_1 = openDatabases_1.next()) {
                var openDatabase2 = openDatabases_1_1.value;
                if (!openDatabase2._closePending) {
                    var event_1 = new FDBVersionChangeEvent_1.default("versionchange", {
                        newVersion: null,
                        oldVersion: db.version,
                    });
                    openDatabase2.dispatchEvent(event_1);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (openDatabases_1_1 && !openDatabases_1_1.done && (_a = openDatabases_1.return)) _a.call(openDatabases_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var anyOpen = openDatabases.some(function (openDatabase3) {
            return !openDatabase3._closed && !openDatabase3._closePending;
        });
        if (request && anyOpen) {
            var event_2 = new FDBVersionChangeEvent_1.default("blocked", {
                newVersion: null,
                oldVersion: db.version,
            });
            request.dispatchEvent(event_2);
        }
        waitForOthersClosedDelete(databases, name, openDatabases, cb);
    }
    catch (err) {
        cb(err);
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-running-a-versionchange-transaction
var runVersionchangeTransaction = function (connection, version, request, cb) {
    var e_2, _a;
    connection._runningVersionchangeTransaction = true;
    var oldVersion = connection.version;
    var openDatabases = connection._rawDatabase.connections.filter(function (otherDatabase) {
        return connection !== otherDatabase;
    });
    try {
        for (var openDatabases_2 = __values(openDatabases), openDatabases_2_1 = openDatabases_2.next(); !openDatabases_2_1.done; openDatabases_2_1 = openDatabases_2.next()) {
            var openDatabase2 = openDatabases_2_1.value;
            if (!openDatabase2._closed && !openDatabase2._closePending) {
                var event_3 = new FDBVersionChangeEvent_1.default("versionchange", {
                    newVersion: version,
                    oldVersion: oldVersion,
                });
                openDatabase2.dispatchEvent(event_3);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (openDatabases_2_1 && !openDatabases_2_1.done && (_a = openDatabases_2.return)) _a.call(openDatabases_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var anyOpen = openDatabases.some(function (openDatabase3) {
        return !openDatabase3._closed && !openDatabase3._closePending;
    });
    if (anyOpen) {
        var event_4 = new FDBVersionChangeEvent_1.default("blocked", {
            newVersion: version,
            oldVersion: oldVersion,
        });
        request.dispatchEvent(event_4);
    }
    var waitForOthersClosed = function () {
        var anyOpen2 = openDatabases.some(function (openDatabase2) {
            return !openDatabase2._closed && !openDatabase2._closePending;
        });
        if (anyOpen2) {
            setImmediate(waitForOthersClosed);
            return;
        }
        // Set the version of database to version. This change is considered part of the transaction, and so if the
        // transaction is aborted, this change is reverted.
        connection._rawDatabase.version = version;
        connection.version = version;
        // Get rid of this setImmediate?
        var transaction = connection.transaction(connection.objectStoreNames, "versionchange");
        request.result = connection;
        request.readyState = "done";
        request.transaction = transaction;
        transaction._rollbackLog.push(function () {
            connection._rawDatabase.version = oldVersion;
            connection.version = oldVersion;
        });
        var event = new FDBVersionChangeEvent_1.default("upgradeneeded", {
            newVersion: version,
            oldVersion: oldVersion,
        });
        request.dispatchEvent(event);
        transaction.addEventListener("error", function () {
            connection._runningVersionchangeTransaction = false;
            // throw arguments[0].target.error;
            // console.log("error in versionchange transaction - not sure if anything needs to be done here", e.target.error.name);
        });
        transaction.addEventListener("abort", function () {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            setImmediate(function () {
                cb(new errors_1.AbortError());
            });
        });
        transaction.addEventListener("complete", function () {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            // Let other complete event handlers run before continuing
            setImmediate(function () {
                if (connection._closePending) {
                    cb(new errors_1.AbortError());
                }
                else {
                    cb(null);
                }
            });
        });
    };
    waitForOthersClosed();
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-opening-a-database
var openDatabase = function (databases, name, version, request, cb) {
    var db = databases.get(name);
    if (db === undefined) {
        db = new Database_1.default(name, 0);
        databases.set(name, db);
    }
    if (version === undefined) {
        version = db.version !== 0 ? db.version : 1;
    }
    if (db.version > version) {
        return cb(new errors_1.VersionError());
    }
    var connection = new FDBDatabase_1.default(db);
    if (db.version < version) {
        runVersionchangeTransaction(connection, version, request, function (err) {
            if (err) {
                // DO THIS HERE: ensure that connection is closed by running the steps for closing a database connection before these
                // steps are aborted.
                return cb(err);
            }
            cb(null, connection);
        });
    }
    else {
        cb(null, connection);
    }
};
var FDBFactory = /** @class */ (function () {
    function FDBFactory() {
        this.cmp = cmp_1.default;
        this._databases = new Map();
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-deleteDatabase-IDBOpenDBRequest-DOMString-name
    FDBFactory.prototype.deleteDatabase = function (name) {
        var _this = this;
        var request = new FDBOpenDBRequest_1.default();
        request.source = null;
        setImmediate(function () {
            var db = _this._databases.get(name);
            var oldVersion = db !== undefined ? db.version : 0;
            deleteDatabase(_this._databases, name, request, function (err) {
                if (err) {
                    request.error = new Error();
                    request.error.name = err.name;
                    request.readyState = "done";
                    var event_5 = new FakeEvent_1.default("error", {
                        bubbles: true,
                        cancelable: true,
                    });
                    event_5.eventPath = [];
                    request.dispatchEvent(event_5);
                    return;
                }
                request.result = undefined;
                request.readyState = "done";
                var event2 = new FDBVersionChangeEvent_1.default("success", {
                    newVersion: null,
                    oldVersion: oldVersion,
                });
                request.dispatchEvent(event2);
            });
        });
        return request;
    };
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-open-IDBOpenDBRequest-DOMString-name-unsigned-long-long-version
    FDBFactory.prototype.open = function (name, version) {
        var _this = this;
        if (arguments.length > 1 && version !== undefined) {
            // Based on spec, not sure why "MAX_SAFE_INTEGER" instead of "unsigned long long", but it's needed to pass
            // tests
            version = enforceRange_1.default(version, "MAX_SAFE_INTEGER");
        }
        if (version === 0) {
            throw new TypeError();
        }
        var request = new FDBOpenDBRequest_1.default();
        request.source = null;
        setImmediate(function () {
            openDatabase(_this._databases, name, version, request, function (err, connection) {
                if (err) {
                    request.result = undefined;
                    request.readyState = "done";
                    request.error = new Error();
                    request.error.name = err.name;
                    var event_6 = new FakeEvent_1.default("error", {
                        bubbles: true,
                        cancelable: true,
                    });
                    event_6.eventPath = [];
                    request.dispatchEvent(event_6);
                    return;
                }
                request.result = connection;
                request.readyState = "done";
                var event2 = new FakeEvent_1.default("success");
                event2.eventPath = [];
                request.dispatchEvent(event2);
            });
        });
        return request;
    };
    // https://w3c.github.io/IndexedDB/#dom-idbfactory-databases
    FDBFactory.prototype.databases = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var e_3, _a;
            var result = [];
            try {
                for (var _b = __values(_this._databases), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), name_1 = _d[0], database = _d[1];
                    result.push({
                        name: name_1,
                        version: database.version,
                    });
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
            resolve(result);
        });
    };
    FDBFactory.prototype.toString = function () {
        return "[object IDBFactory]";
    };
    return FDBFactory;
}());
exports.default = FDBFactory;

}).call(this)}).call(this,require("timers").setImmediate)
},{"./FDBDatabase":8,"./FDBOpenDBRequest":13,"./FDBVersionChangeEvent":16,"./lib/Database":18,"./lib/FakeEvent":19,"./lib/cmp":27,"./lib/enforceRange":28,"./lib/errors":29,"setimmediate":37,"timers":5}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBCursor_1 = require("./FDBCursor");
var FDBCursorWithValue_1 = require("./FDBCursorWithValue");
var FDBKeyRange_1 = require("./FDBKeyRange");
var FDBRequest_1 = require("./FDBRequest");
var enforceRange_1 = require("./lib/enforceRange");
var errors_1 = require("./lib/errors");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var valueToKey_1 = require("./lib/valueToKey");
var valueToKeyRange_1 = require("./lib/valueToKeyRange");
var confirmActiveTransaction = function (index) {
    if (index._rawIndex.deleted || index.objectStore._rawObjectStore.deleted) {
        throw new errors_1.InvalidStateError();
    }
    if (index.objectStore.transaction._state !== "active") {
        throw new errors_1.TransactionInactiveError();
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#idl-def-IDBIndex
var FDBIndex = /** @class */ (function () {
    function FDBIndex(objectStore, rawIndex) {
        this._rawIndex = rawIndex;
        this._name = rawIndex.name;
        this.objectStore = objectStore;
        this.keyPath = rawIndex.keyPath;
        this.multiEntry = rawIndex.multiEntry;
        this.unique = rawIndex.unique;
    }
    Object.defineProperty(FDBIndex.prototype, "name", {
        get: function () {
            return this._name;
        },
        // https://w3c.github.io/IndexedDB/#dom-idbindex-name
        set: function (name) {
            var _this = this;
            var transaction = this.objectStore.transaction;
            if (!transaction.db._runningVersionchangeTransaction) {
                throw new errors_1.InvalidStateError();
            }
            if (transaction._state !== "active") {
                throw new errors_1.TransactionInactiveError();
            }
            if (this._rawIndex.deleted ||
                this.objectStore._rawObjectStore.deleted) {
                throw new errors_1.InvalidStateError();
            }
            name = String(name);
            if (name === this._name) {
                return;
            }
            if (this.objectStore.indexNames.indexOf(name) >= 0) {
                throw new errors_1.ConstraintError();
            }
            var oldName = this._name;
            var oldIndexNames = this.objectStore.indexNames.slice();
            this._name = name;
            this._rawIndex.name = name;
            this.objectStore._indexesCache.delete(oldName);
            this.objectStore._indexesCache.set(name, this);
            this.objectStore._rawObjectStore.rawIndexes.delete(oldName);
            this.objectStore._rawObjectStore.rawIndexes.set(name, this._rawIndex);
            this.objectStore.indexNames = fakeDOMStringList_1.default(Array.from(this.objectStore._rawObjectStore.rawIndexes.keys()).filter(function (indexName) {
                var index = _this.objectStore._rawObjectStore.rawIndexes.get(indexName);
                return index && !index.deleted;
            })).sort();
            transaction._rollbackLog.push(function () {
                _this._name = oldName;
                _this._rawIndex.name = oldName;
                _this.objectStore._indexesCache.delete(name);
                _this.objectStore._indexesCache.set(oldName, _this);
                _this.objectStore._rawObjectStore.rawIndexes.delete(name);
                _this.objectStore._rawObjectStore.rawIndexes.set(oldName, _this._rawIndex);
                _this.objectStore.indexNames = fakeDOMStringList_1.default(oldIndexNames);
            });
        },
        enumerable: true,
        configurable: true
    });
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openCursor-IDBRequest-any-range-IDBCursorDirection-direction
    FDBIndex.prototype.openCursor = function (range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.objectStore.transaction;
        var cursor = new FDBCursorWithValue_1.default(this, range, direction, request);
        return this.objectStore.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openKeyCursor-IDBRequest-any-range-IDBCursorDirection-direction
    FDBIndex.prototype.openKeyCursor = function (range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.objectStore.transaction;
        var cursor = new FDBCursor_1.default(this, range, direction, request, true);
        return this.objectStore.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    FDBIndex.prototype.get = function (key) {
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getValue.bind(this._rawIndex, key),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbindex-getall
    FDBIndex.prototype.getAll = function (query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getAllValues.bind(this._rawIndex, range, count),
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-getKey-IDBRequest-any-key
    FDBIndex.prototype.getKey = function (key) {
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getKey.bind(this._rawIndex, key),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbindex-getallkeys
    FDBIndex.prototype.getAllKeys = function (query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getAllKeys.bind(this._rawIndex, range, count),
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-count-IDBRequest-any-key
    FDBIndex.prototype.count = function (key) {
        var _this = this;
        confirmActiveTransaction(this);
        if (key === null) {
            key = undefined;
        }
        if (key !== undefined && !(key instanceof FDBKeyRange_1.default)) {
            key = FDBKeyRange_1.default.only(valueToKey_1.default(key));
        }
        return this.objectStore.transaction._execRequestAsync({
            operation: function () {
                var count = 0;
                var cursor = new FDBCursor_1.default(_this, key);
                while (cursor._iterate() !== null) {
                    count += 1;
                }
                return count;
            },
            source: this,
        });
    };
    FDBIndex.prototype.toString = function () {
        return "[object IDBIndex]";
    };
    return FDBIndex;
}());
exports.default = FDBIndex;

},{"./FDBCursor":6,"./FDBCursorWithValue":7,"./FDBKeyRange":11,"./FDBRequest":14,"./lib/enforceRange":28,"./lib/errors":29,"./lib/fakeDOMStringList":31,"./lib/valueToKey":34,"./lib/valueToKeyRange":35}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cmp_1 = require("./lib/cmp");
var errors_1 = require("./lib/errors");
var valueToKey_1 = require("./lib/valueToKey");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#range-concept
var FDBKeyRange = /** @class */ (function () {
    function FDBKeyRange(lower, upper, lowerOpen, upperOpen) {
        this.lower = lower;
        this.upper = upper;
        this.lowerOpen = lowerOpen;
        this.upperOpen = upperOpen;
    }
    FDBKeyRange.only = function (value) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        value = valueToKey_1.default(value);
        return new FDBKeyRange(value, value, false, false);
    };
    FDBKeyRange.lowerBound = function (lower, open) {
        if (open === void 0) { open = false; }
        if (arguments.length === 0) {
            throw new TypeError();
        }
        lower = valueToKey_1.default(lower);
        return new FDBKeyRange(lower, undefined, open, true);
    };
    FDBKeyRange.upperBound = function (upper, open) {
        if (open === void 0) { open = false; }
        if (arguments.length === 0) {
            throw new TypeError();
        }
        upper = valueToKey_1.default(upper);
        return new FDBKeyRange(undefined, upper, true, open);
    };
    FDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
        if (lowerOpen === void 0) { lowerOpen = false; }
        if (upperOpen === void 0) { upperOpen = false; }
        if (arguments.length < 2) {
            throw new TypeError();
        }
        var cmpResult = cmp_1.default(lower, upper);
        if (cmpResult === 1 || (cmpResult === 0 && (lowerOpen || upperOpen))) {
            throw new errors_1.DataError();
        }
        lower = valueToKey_1.default(lower);
        upper = valueToKey_1.default(upper);
        return new FDBKeyRange(lower, upper, lowerOpen, upperOpen);
    };
    // https://w3c.github.io/IndexedDB/#dom-idbkeyrange-includes
    FDBKeyRange.prototype.includes = function (key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        key = valueToKey_1.default(key);
        if (this.lower !== undefined) {
            var cmpResult = cmp_1.default(this.lower, key);
            if (cmpResult === 1 || (cmpResult === 0 && this.lowerOpen)) {
                return false;
            }
        }
        if (this.upper !== undefined) {
            var cmpResult = cmp_1.default(this.upper, key);
            if (cmpResult === -1 || (cmpResult === 0 && this.upperOpen)) {
                return false;
            }
        }
        return true;
    };
    FDBKeyRange.prototype.toString = function () {
        return "[object IDBKeyRange]";
    };
    return FDBKeyRange;
}());
exports.default = FDBKeyRange;

},{"./lib/cmp":27,"./lib/errors":29,"./lib/valueToKey":34}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBCursor_1 = require("./FDBCursor");
var FDBCursorWithValue_1 = require("./FDBCursorWithValue");
var FDBIndex_1 = require("./FDBIndex");
var FDBKeyRange_1 = require("./FDBKeyRange");
var FDBRequest_1 = require("./FDBRequest");
var canInjectKey_1 = require("./lib/canInjectKey");
var enforceRange_1 = require("./lib/enforceRange");
var errors_1 = require("./lib/errors");
var extractKey_1 = require("./lib/extractKey");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var Index_1 = require("./lib/Index");
var structuredClone_1 = require("./lib/structuredClone");
var validateKeyPath_1 = require("./lib/validateKeyPath");
var valueToKey_1 = require("./lib/valueToKey");
var valueToKeyRange_1 = require("./lib/valueToKeyRange");
var confirmActiveTransaction = function (objectStore) {
    if (objectStore._rawObjectStore.deleted) {
        throw new errors_1.InvalidStateError();
    }
    if (objectStore.transaction._state !== "active") {
        throw new errors_1.TransactionInactiveError();
    }
};
var buildRecordAddPut = function (objectStore, value, key) {
    confirmActiveTransaction(objectStore);
    if (objectStore.transaction.mode === "readonly") {
        throw new errors_1.ReadOnlyError();
    }
    if (objectStore.keyPath !== null) {
        if (key !== undefined) {
            throw new errors_1.DataError();
        }
    }
    var clone = structuredClone_1.default(value);
    if (objectStore.keyPath !== null) {
        var tempKey = extractKey_1.default(objectStore.keyPath, clone);
        if (tempKey !== undefined) {
            valueToKey_1.default(tempKey);
        }
        else {
            if (!objectStore._rawObjectStore.keyGenerator) {
                throw new errors_1.DataError();
            }
            else if (!canInjectKey_1.default(objectStore.keyPath, clone)) {
                throw new errors_1.DataError();
            }
        }
    }
    if (objectStore.keyPath === null &&
        objectStore._rawObjectStore.keyGenerator === null &&
        key === undefined) {
        throw new errors_1.DataError();
    }
    if (key !== undefined) {
        key = valueToKey_1.default(key);
    }
    return {
        key: key,
        value: clone,
    };
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#object-store
var FDBObjectStore = /** @class */ (function () {
    function FDBObjectStore(transaction, rawObjectStore) {
        this._indexesCache = new Map();
        this._rawObjectStore = rawObjectStore;
        this._name = rawObjectStore.name;
        this.keyPath = rawObjectStore.keyPath;
        this.autoIncrement = rawObjectStore.autoIncrement;
        this.transaction = transaction;
        this.indexNames = fakeDOMStringList_1.default(Array.from(rawObjectStore.rawIndexes.keys())).sort();
    }
    Object.defineProperty(FDBObjectStore.prototype, "name", {
        get: function () {
            return this._name;
        },
        // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-name
        set: function (name) {
            var _this = this;
            var transaction = this.transaction;
            if (!transaction.db._runningVersionchangeTransaction) {
                throw new errors_1.InvalidStateError();
            }
            confirmActiveTransaction(this);
            name = String(name);
            if (name === this._name) {
                return;
            }
            if (this._rawObjectStore.rawDatabase.rawObjectStores.has(name)) {
                throw new errors_1.ConstraintError();
            }
            var oldName = this._name;
            var oldObjectStoreNames = transaction.db.objectStoreNames.slice();
            this._name = name;
            this._rawObjectStore.name = name;
            this.transaction._objectStoresCache.delete(oldName);
            this.transaction._objectStoresCache.set(name, this);
            this._rawObjectStore.rawDatabase.rawObjectStores.delete(oldName);
            this._rawObjectStore.rawDatabase.rawObjectStores.set(name, this._rawObjectStore);
            transaction.db.objectStoreNames = fakeDOMStringList_1.default(Array.from(this._rawObjectStore.rawDatabase.rawObjectStores.keys()).filter(function (objectStoreName) {
                var objectStore = _this._rawObjectStore.rawDatabase.rawObjectStores.get(objectStoreName);
                return objectStore && !objectStore.deleted;
            })).sort();
            var oldScope = new Set(transaction._scope);
            var oldTransactionObjectStoreNames = transaction.objectStoreNames.slice();
            this.transaction._scope.delete(oldName);
            transaction._scope.add(name);
            transaction.objectStoreNames = fakeDOMStringList_1.default(Array.from(transaction._scope).sort());
            transaction._rollbackLog.push(function () {
                _this._name = oldName;
                _this._rawObjectStore.name = oldName;
                _this.transaction._objectStoresCache.delete(name);
                _this.transaction._objectStoresCache.set(oldName, _this);
                _this._rawObjectStore.rawDatabase.rawObjectStores.delete(name);
                _this._rawObjectStore.rawDatabase.rawObjectStores.set(oldName, _this._rawObjectStore);
                transaction.db.objectStoreNames = fakeDOMStringList_1.default(oldObjectStoreNames);
                transaction._scope = oldScope;
                transaction.objectStoreNames = fakeDOMStringList_1.default(oldTransactionObjectStoreNames);
            });
        },
        enumerable: true,
        configurable: true
    });
    FDBObjectStore.prototype.put = function (value, key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        var record = buildRecordAddPut(this, value, key);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.storeRecord.bind(this._rawObjectStore, record, false, this.transaction._rollbackLog),
            source: this,
        });
    };
    FDBObjectStore.prototype.add = function (value, key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        var record = buildRecordAddPut(this, value, key);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.storeRecord.bind(this._rawObjectStore, record, true, this.transaction._rollbackLog),
            source: this,
        });
    };
    FDBObjectStore.prototype.delete = function (key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        confirmActiveTransaction(this);
        if (this.transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.deleteRecord.bind(this._rawObjectStore, key, this.transaction._rollbackLog),
            source: this,
        });
    };
    FDBObjectStore.prototype.get = function (key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getValue.bind(this._rawObjectStore, key),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-getall
    FDBObjectStore.prototype.getAll = function (query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getAllValues.bind(this._rawObjectStore, range, count),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-getkey
    FDBObjectStore.prototype.getKey = function (key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getKey.bind(this._rawObjectStore, key),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-getallkeys
    FDBObjectStore.prototype.getAllKeys = function (query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getAllKeys.bind(this._rawObjectStore, range, count),
            source: this,
        });
    };
    FDBObjectStore.prototype.clear = function () {
        confirmActiveTransaction(this);
        if (this.transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.clear.bind(this._rawObjectStore, this.transaction._rollbackLog),
            source: this,
        });
    };
    FDBObjectStore.prototype.openCursor = function (range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.transaction;
        var cursor = new FDBCursorWithValue_1.default(this, range, direction, request);
        return this.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    FDBObjectStore.prototype.openKeyCursor = function (range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.transaction;
        var cursor = new FDBCursor_1.default(this, range, direction, request, true);
        return this.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBObjectStore-createIndex-IDBIndex-DOMString-name-DOMString-sequence-DOMString--keyPath-IDBIndexParameters-optionalParameters
    FDBObjectStore.prototype.createIndex = function (name, keyPath, optionalParameters) {
        var _this = this;
        if (optionalParameters === void 0) { optionalParameters = {}; }
        if (arguments.length < 2) {
            throw new TypeError();
        }
        var multiEntry = optionalParameters.multiEntry !== undefined
            ? optionalParameters.multiEntry
            : false;
        var unique = optionalParameters.unique !== undefined
            ? optionalParameters.unique
            : false;
        if (this.transaction.mode !== "versionchange") {
            throw new errors_1.InvalidStateError();
        }
        confirmActiveTransaction(this);
        if (this.indexNames.indexOf(name) >= 0) {
            throw new errors_1.ConstraintError();
        }
        validateKeyPath_1.default(keyPath);
        if (Array.isArray(keyPath) && multiEntry) {
            throw new errors_1.InvalidAccessError();
        }
        // The index that is requested to be created can contain constraints on the data allowed in the index's
        // referenced object store, such as requiring uniqueness of the values referenced by the index's keyPath. If the
        // referenced object store already contains data which violates these constraints, this MUST NOT cause the
        // implementation of createIndex to throw an exception or affect what it returns. The implementation MUST still
        // create and return an IDBIndex object. Instead the implementation must queue up an operation to abort the
        // "versionchange" transaction which was used for the createIndex call.
        var indexNames = this.indexNames.slice();
        this.transaction._rollbackLog.push(function () {
            var index2 = _this._rawObjectStore.rawIndexes.get(name);
            if (index2) {
                index2.deleted = true;
            }
            _this.indexNames = fakeDOMStringList_1.default(indexNames);
            _this._rawObjectStore.rawIndexes.delete(name);
        });
        var index = new Index_1.default(this._rawObjectStore, name, keyPath, multiEntry, unique);
        this.indexNames.push(name);
        this.indexNames.sort();
        this._rawObjectStore.rawIndexes.set(name, index);
        index.initialize(this.transaction); // This is async by design
        return new FDBIndex_1.default(this, index);
    };
    // https://w3c.github.io/IndexedDB/#dom-idbobjectstore-index
    FDBObjectStore.prototype.index = function (name) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        if (this._rawObjectStore.deleted ||
            this.transaction._state === "finished") {
            throw new errors_1.InvalidStateError();
        }
        var index = this._indexesCache.get(name);
        if (index !== undefined) {
            return index;
        }
        var rawIndex = this._rawObjectStore.rawIndexes.get(name);
        if (this.indexNames.indexOf(name) < 0 || rawIndex === undefined) {
            throw new errors_1.NotFoundError();
        }
        var index2 = new FDBIndex_1.default(this, rawIndex);
        this._indexesCache.set(name, index2);
        return index2;
    };
    FDBObjectStore.prototype.deleteIndex = function (name) {
        var _this = this;
        if (arguments.length === 0) {
            throw new TypeError();
        }
        if (this.transaction.mode !== "versionchange") {
            throw new errors_1.InvalidStateError();
        }
        confirmActiveTransaction(this);
        var rawIndex = this._rawObjectStore.rawIndexes.get(name);
        if (rawIndex === undefined) {
            throw new errors_1.NotFoundError();
        }
        this.transaction._rollbackLog.push(function () {
            rawIndex.deleted = false;
            _this._rawObjectStore.rawIndexes.set(name, rawIndex);
            _this.indexNames.push(name);
            _this.indexNames.sort();
        });
        this.indexNames = fakeDOMStringList_1.default(this.indexNames.filter(function (indexName) {
            return indexName !== name;
        }));
        rawIndex.deleted = true; // Not sure if this is supposed to happen synchronously
        this.transaction._execRequestAsync({
            operation: function () {
                var rawIndex2 = _this._rawObjectStore.rawIndexes.get(name);
                // Hack in case another index is given this name before this async request is processed. It'd be better
                // to have a real unique ID for each index.
                if (rawIndex === rawIndex2) {
                    _this._rawObjectStore.rawIndexes.delete(name);
                }
            },
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBObjectStore-count-IDBRequest-any-key
    FDBObjectStore.prototype.count = function (key) {
        var _this = this;
        confirmActiveTransaction(this);
        if (key === null) {
            key = undefined;
        }
        if (key !== undefined && !(key instanceof FDBKeyRange_1.default)) {
            key = FDBKeyRange_1.default.only(valueToKey_1.default(key));
        }
        return this.transaction._execRequestAsync({
            operation: function () {
                var count = 0;
                var cursor = new FDBCursor_1.default(_this, key);
                while (cursor._iterate() !== null) {
                    count += 1;
                }
                return count;
            },
            source: this,
        });
    };
    FDBObjectStore.prototype.toString = function () {
        return "[object IDBObjectStore]";
    };
    return FDBObjectStore;
}());
exports.default = FDBObjectStore;

},{"./FDBCursor":6,"./FDBCursorWithValue":7,"./FDBIndex":10,"./FDBKeyRange":11,"./FDBRequest":14,"./lib/Index":21,"./lib/canInjectKey":26,"./lib/enforceRange":28,"./lib/errors":29,"./lib/extractKey":30,"./lib/fakeDOMStringList":31,"./lib/structuredClone":32,"./lib/validateKeyPath":33,"./lib/valueToKey":34,"./lib/valueToKeyRange":35}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FDBRequest_1 = require("./FDBRequest");
var FDBOpenDBRequest = /** @class */ (function (_super) {
    __extends(FDBOpenDBRequest, _super);
    function FDBOpenDBRequest() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onupgradeneeded = null;
        _this.onblocked = null;
        return _this;
    }
    FDBOpenDBRequest.prototype.toString = function () {
        return "[object IDBOpenDBRequest]";
    };
    return FDBOpenDBRequest;
}(FDBRequest_1.default));
exports.default = FDBOpenDBRequest;

},{"./FDBRequest":14}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./lib/errors");
var FakeEventTarget_1 = require("./lib/FakeEventTarget");
var FDBRequest = /** @class */ (function (_super) {
    __extends(FDBRequest, _super);
    function FDBRequest() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._result = null;
        _this._error = null;
        _this.source = null;
        _this.transaction = null;
        _this.readyState = "pending";
        _this.onsuccess = null;
        _this.onerror = null;
        return _this;
    }
    Object.defineProperty(FDBRequest.prototype, "error", {
        get: function () {
            if (this.readyState === "pending") {
                throw new errors_1.InvalidStateError();
            }
            return this._error;
        },
        set: function (value) {
            this._error = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FDBRequest.prototype, "result", {
        get: function () {
            if (this.readyState === "pending") {
                throw new errors_1.InvalidStateError();
            }
            return this._result;
        },
        set: function (value) {
            this._result = value;
        },
        enumerable: true,
        configurable: true
    });
    FDBRequest.prototype.toString = function () {
        return "[object IDBRequest]";
    };
    return FDBRequest;
}(FakeEventTarget_1.default));
exports.default = FDBRequest;

},{"./lib/FakeEventTarget":20,"./lib/errors":29}],15:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var FDBObjectStore_1 = require("./FDBObjectStore");
var FDBRequest_1 = require("./FDBRequest");
var errors_1 = require("./lib/errors");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var FakeEvent_1 = require("./lib/FakeEvent");
var FakeEventTarget_1 = require("./lib/FakeEventTarget");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#transaction
var FDBTransaction = /** @class */ (function (_super) {
    __extends(FDBTransaction, _super);
    function FDBTransaction(storeNames, mode, db) {
        var _this = _super.call(this) || this;
        _this._state = "active";
        _this._started = false;
        _this._rollbackLog = [];
        _this._objectStoresCache = new Map();
        _this.error = null;
        _this.onabort = null;
        _this.oncomplete = null;
        _this.onerror = null;
        _this._requests = [];
        _this._scope = new Set(storeNames);
        _this.mode = mode;
        _this.db = db;
        _this.objectStoreNames = fakeDOMStringList_1.default(Array.from(_this._scope).sort());
        return _this;
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-aborting-a-transaction
    FDBTransaction.prototype._abort = function (errName) {
        var e_1, _a, e_2, _b;
        var _this = this;
        try {
            for (var _c = __values(this._rollbackLog.reverse()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var f = _d.value;
                f();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (errName !== null) {
            var e = new Error();
            e.name = errName;
            this.error = e;
        }
        try {
            // Should this directly remove from _requests?
            for (var _e = __values(this._requests), _f = _e.next(); !_f.done; _f = _e.next()) {
                var request = _f.value.request;
                if (request.readyState !== "done") {
                    request.readyState = "done"; // This will cancel execution of this request's operation
                    if (request.source) {
                        request.result = undefined;
                        request.error = new errors_1.AbortError();
                        var event_1 = new FakeEvent_1.default("error", {
                            bubbles: true,
                            cancelable: true,
                        });
                        event_1.eventPath = [this.db, this];
                        request.dispatchEvent(event_1);
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        setImmediate(function () {
            var event = new FakeEvent_1.default("abort", {
                bubbles: true,
                cancelable: false,
            });
            event.eventPath = [_this.db];
            _this.dispatchEvent(event);
        });
        this._state = "finished";
    };
    FDBTransaction.prototype.abort = function () {
        if (this._state === "committing" || this._state === "finished") {
            throw new errors_1.InvalidStateError();
        }
        this._state = "active";
        this._abort(null);
    };
    // http://w3c.github.io/IndexedDB/#dom-idbtransaction-objectstore
    FDBTransaction.prototype.objectStore = function (name) {
        if (this._state !== "active") {
            throw new errors_1.InvalidStateError();
        }
        var objectStore = this._objectStoresCache.get(name);
        if (objectStore !== undefined) {
            return objectStore;
        }
        var rawObjectStore = this.db._rawDatabase.rawObjectStores.get(name);
        if (!this._scope.has(name) || rawObjectStore === undefined) {
            throw new errors_1.NotFoundError();
        }
        var objectStore2 = new FDBObjectStore_1.default(this, rawObjectStore);
        this._objectStoresCache.set(name, objectStore2);
        return objectStore2;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-asynchronously-executing-a-request
    FDBTransaction.prototype._execRequestAsync = function (obj) {
        var source = obj.source;
        var operation = obj.operation;
        var request = obj.hasOwnProperty("request") ? obj.request : null;
        if (this._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        // Request should only be passed for cursors
        if (!request) {
            if (!source) {
                // Special requests like indexes that just need to run some code
                request = new FDBRequest_1.default();
            }
            else {
                request = new FDBRequest_1.default();
                request.source = source;
                request.transaction = source.transaction;
            }
        }
        this._requests.push({
            operation: operation,
            request: request,
        });
        return request;
    };
    FDBTransaction.prototype._start = function () {
        this._started = true;
        // Remove from request queue - cursor ones will be added back if necessary by cursor.continue and such
        var operation;
        var request;
        while (this._requests.length > 0) {
            var r = this._requests.shift();
            // This should only be false if transaction was aborted
            if (r && r.request.readyState !== "done") {
                request = r.request;
                operation = r.operation;
                break;
            }
        }
        if (request && operation) {
            if (!request.source) {
                // Special requests like indexes that just need to run some code, with error handling already built into
                // operation
                operation();
            }
            else {
                var defaultAction = void 0;
                var event_2;
                try {
                    var result = operation();
                    request.readyState = "done";
                    request.result = result;
                    request.error = undefined;
                    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-fire-a-success-event
                    if (this._state === "inactive") {
                        this._state = "active";
                    }
                    event_2 = new FakeEvent_1.default("success", {
                        bubbles: false,
                        cancelable: false,
                    });
                }
                catch (err) {
                    request.readyState = "done";
                    request.result = undefined;
                    request.error = err;
                    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-fire-an-error-event
                    if (this._state === "inactive") {
                        this._state = "active";
                    }
                    event_2 = new FakeEvent_1.default("error", {
                        bubbles: true,
                        cancelable: true,
                    });
                    defaultAction = this._abort.bind(this, err.name);
                }
                try {
                    event_2.eventPath = [this.db, this];
                    request.dispatchEvent(event_2);
                }
                catch (err) {
                    if (this._state !== "committing") {
                        this._abort("AbortError");
                    }
                    throw err;
                }
                // Default action of event
                if (!event_2.canceled) {
                    if (defaultAction) {
                        defaultAction();
                    }
                }
            }
            // Give it another chance for new handlers to be set before finishing
            setImmediate(this._start.bind(this));
            return;
        }
        // Check if transaction complete event needs to be fired
        if (this._state !== "finished") {
            // Either aborted or committed already
            this._state = "finished";
            if (!this.error) {
                var event_3 = new FakeEvent_1.default("complete");
                this.dispatchEvent(event_3);
            }
        }
    };
    FDBTransaction.prototype.commit = function () {
        if (this._state !== "active") {
            throw new errors_1.InvalidStateError();
        }
        this._state = "committing";
    };
    FDBTransaction.prototype.toString = function () {
        return "[object IDBRequest]";
    };
    return FDBTransaction;
}(FakeEventTarget_1.default));
exports.default = FDBTransaction;

}).call(this)}).call(this,require("timers").setImmediate)
},{"./FDBObjectStore":12,"./FDBRequest":14,"./lib/FakeEvent":19,"./lib/FakeEventTarget":20,"./lib/errors":29,"./lib/fakeDOMStringList":31,"timers":5}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FakeEvent_1 = require("./lib/FakeEvent");
var FDBVersionChangeEvent = /** @class */ (function (_super) {
    __extends(FDBVersionChangeEvent, _super);
    function FDBVersionChangeEvent(type, parameters) {
        if (parameters === void 0) { parameters = {}; }
        var _this = _super.call(this, type) || this;
        _this.newVersion =
            parameters.newVersion !== undefined ? parameters.newVersion : null;
        _this.oldVersion =
            parameters.oldVersion !== undefined ? parameters.oldVersion : 0;
        return _this;
    }
    FDBVersionChangeEvent.prototype.toString = function () {
        return "[object IDBVersionChangeEvent]";
    };
    return FDBVersionChangeEvent;
}(FakeEvent_1.default));
exports.default = FDBVersionChangeEvent;

},{"./lib/FakeEvent":19}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBFactory_1 = require("./FDBFactory");
var fakeIndexedDB = new FDBFactory_1.default();
exports.default = fakeIndexedDB;

},{"./FDBFactory":9}],18:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-database
var Database = /** @class */ (function () {
    function Database(name, version) {
        this.deletePending = false;
        this.transactions = [];
        this.rawObjectStores = new Map();
        this.connections = [];
        this.name = name;
        this.version = version;
        this.processTransactions = this.processTransactions.bind(this);
    }
    Database.prototype.processTransactions = function () {
        var _this = this;
        setImmediate(function () {
            var anyRunning = _this.transactions.some(function (transaction) {
                return (transaction._started && transaction._state !== "finished");
            });
            if (!anyRunning) {
                var next = _this.transactions.find(function (transaction) {
                    return (!transaction._started &&
                        transaction._state !== "finished");
                });
                if (next) {
                    next.addEventListener("complete", _this.processTransactions);
                    next.addEventListener("abort", _this.processTransactions);
                    next._start();
                }
            }
        });
    };
    return Database;
}());
exports.default = Database;

}).call(this)}).call(this,require("timers").setImmediate)
},{"timers":5}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Event = /** @class */ (function () {
    function Event(type, eventInitDict) {
        if (eventInitDict === void 0) { eventInitDict = {}; }
        this.eventPath = [];
        this.NONE = 0;
        this.CAPTURING_PHASE = 1;
        this.AT_TARGET = 2;
        this.BUBBLING_PHASE = 3;
        // Flags
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
        this.canceled = false;
        this.initialized = true;
        this.dispatched = false;
        this.target = null;
        this.currentTarget = null;
        this.eventPhase = 0;
        this.defaultPrevented = false;
        this.isTrusted = false;
        this.timeStamp = Date.now();
        this.type = type;
        this.bubbles =
            eventInitDict.bubbles !== undefined ? eventInitDict.bubbles : false;
        this.cancelable =
            eventInitDict.cancelable !== undefined
                ? eventInitDict.cancelable
                : false;
    }
    Event.prototype.preventDefault = function () {
        if (this.cancelable) {
            this.canceled = true;
        }
    };
    Event.prototype.stopPropagation = function () {
        this.propagationStopped = true;
    };
    Event.prototype.stopImmediatePropagation = function () {
        this.propagationStopped = true;
        this.immediatePropagationStopped = true;
    };
    return Event;
}());
exports.default = Event;

},{}],20:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var stopped = function (event, listener) {
    return (event.immediatePropagationStopped ||
        (event.eventPhase === event.CAPTURING_PHASE &&
            listener.capture === false) ||
        (event.eventPhase === event.BUBBLING_PHASE && listener.capture === true));
};
// http://www.w3.org/TR/dom/#concept-event-listener-invoke
var invokeEventListeners = function (event, obj) {
    var e_1, _a;
    event.currentTarget = obj;
    try {
        // The callback might cause obj.listeners to mutate as we traverse it.
        // Take a copy of the array so that nothing sneaks in and we don't lose
        // our place.
        for (var _b = __values(obj.listeners.slice()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var listener = _c.value;
            if (event.type !== listener.type || stopped(event, listener)) {
                continue;
            }
            // @ts-ignore
            listener.callback.call(event.currentTarget, event);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var typeToProp = {
        abort: "onabort",
        blocked: "onblocked",
        complete: "oncomplete",
        error: "onerror",
        success: "onsuccess",
        upgradeneeded: "onupgradeneeded",
        versionchange: "onversionchange",
    };
    var prop = typeToProp[event.type];
    if (prop === undefined) {
        throw new Error("Unknown event type: \"" + event.type + "\"");
    }
    var callback = event.currentTarget[prop];
    if (callback) {
        var listener = {
            callback: callback,
            capture: false,
            type: event.type,
        };
        if (!stopped(event, listener)) {
            // @ts-ignore
            listener.callback.call(event.currentTarget, event);
        }
    }
};
var FakeEventTarget = /** @class */ (function () {
    function FakeEventTarget() {
        this.listeners = [];
    }
    FakeEventTarget.prototype.addEventListener = function (type, callback, capture) {
        if (capture === void 0) { capture = false; }
        this.listeners.push({
            callback: callback,
            capture: capture,
            type: type,
        });
    };
    FakeEventTarget.prototype.removeEventListener = function (type, callback, capture) {
        if (capture === void 0) { capture = false; }
        var i = this.listeners.findIndex(function (listener) {
            return (listener.type === type &&
                listener.callback === callback &&
                listener.capture === capture);
        });
        this.listeners.splice(i, 1);
    };
    // http://www.w3.org/TR/dom/#dispatching-events
    FakeEventTarget.prototype.dispatchEvent = function (event) {
        var e_2, _a, e_3, _b;
        if (event.dispatched || !event.initialized) {
            throw new errors_1.InvalidStateError("The object is in an invalid state.");
        }
        event.isTrusted = false;
        event.dispatched = true;
        event.target = this;
        // NOT SURE WHEN THIS SHOULD BE SET        event.eventPath = [];
        event.eventPhase = event.CAPTURING_PHASE;
        try {
            for (var _c = __values(event.eventPath), _d = _c.next(); !_d.done; _d = _c.next()) {
                var obj = _d.value;
                if (!event.propagationStopped) {
                    invokeEventListeners(event, obj);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_2) throw e_2.error; }
        }
        event.eventPhase = event.AT_TARGET;
        if (!event.propagationStopped) {
            invokeEventListeners(event, event.target);
        }
        if (event.bubbles) {
            event.eventPath.reverse();
            event.eventPhase = event.BUBBLING_PHASE;
            try {
                for (var _e = __values(event.eventPath), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var obj = _f.value;
                    if (!event.propagationStopped) {
                        invokeEventListeners(event, obj);
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        event.dispatched = false;
        event.eventPhase = event.NONE;
        event.currentTarget = null;
        if (event.canceled) {
            return false;
        }
        return true;
    };
    return FakeEventTarget;
}());
exports.default = FakeEventTarget;

},{"./errors":29}],21:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var extractKey_1 = require("./extractKey");
var RecordStore_1 = require("./RecordStore");
var structuredClone_1 = require("./structuredClone");
var valueToKey_1 = require("./valueToKey");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-index
var Index = /** @class */ (function () {
    function Index(rawObjectStore, name, keyPath, multiEntry, unique) {
        this.deleted = false;
        // Initialized should be used to decide whether to throw an error or abort the versionchange transaction when there is a
        // constraint
        this.initialized = false;
        this.records = new RecordStore_1.default();
        this.rawObjectStore = rawObjectStore;
        this.name = name;
        this.keyPath = keyPath;
        this.multiEntry = multiEntry;
        this.unique = unique;
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-index
    Index.prototype.getKey = function (key) {
        var record = this.records.get(key);
        return record !== undefined ? record.value : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-referenced-values-from-an-index
    Index.prototype.getAllKeys = function (range, count) {
        var e_1, _a;
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (var _b = __values(this.records.values(range)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var record = _c.value;
                records.push(structuredClone_1.default(record.value));
                if (records.length >= count) {
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return records;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#index-referenced-value-retrieval-operation
    Index.prototype.getValue = function (key) {
        var record = this.records.get(key);
        return record !== undefined
            ? this.rawObjectStore.getValue(record.value)
            : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-referenced-values-from-an-index
    Index.prototype.getAllValues = function (range, count) {
        var e_2, _a;
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (var _b = __values(this.records.values(range)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var record = _c.value;
                records.push(this.rawObjectStore.getValue(record.value));
                if (records.length >= count) {
                    break;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return records;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store (step 7)
    Index.prototype.storeRecord = function (newRecord) {
        var e_3, _a, e_4, _b, e_5, _c;
        var indexKey;
        try {
            indexKey = extractKey_1.default(this.keyPath, newRecord.value);
        }
        catch (err) {
            if (err.name === "DataError") {
                // Invalid key is not an actual error, just means we do not store an entry in this index
                return;
            }
            throw err;
        }
        if (!this.multiEntry || !Array.isArray(indexKey)) {
            try {
                valueToKey_1.default(indexKey);
            }
            catch (e) {
                return;
            }
        }
        else {
            // remove any elements from index key that are not valid keys and remove any duplicate elements from index
            // key such that only one instance of the duplicate value remains.
            var keep = [];
            try {
                for (var indexKey_1 = __values(indexKey), indexKey_1_1 = indexKey_1.next(); !indexKey_1_1.done; indexKey_1_1 = indexKey_1.next()) {
                    var part = indexKey_1_1.value;
                    if (keep.indexOf(part) < 0) {
                        try {
                            keep.push(valueToKey_1.default(part));
                        }
                        catch (err) {
                            /* Do nothing */
                        }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (indexKey_1_1 && !indexKey_1_1.done && (_a = indexKey_1.return)) _a.call(indexKey_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            indexKey = keep;
        }
        if (!this.multiEntry || !Array.isArray(indexKey)) {
            if (this.unique) {
                var existingRecord = this.records.get(indexKey);
                if (existingRecord) {
                    throw new errors_1.ConstraintError();
                }
            }
        }
        else {
            if (this.unique) {
                try {
                    for (var indexKey_2 = __values(indexKey), indexKey_2_1 = indexKey_2.next(); !indexKey_2_1.done; indexKey_2_1 = indexKey_2.next()) {
                        var individualIndexKey = indexKey_2_1.value;
                        var existingRecord = this.records.get(individualIndexKey);
                        if (existingRecord) {
                            throw new errors_1.ConstraintError();
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (indexKey_2_1 && !indexKey_2_1.done && (_b = indexKey_2.return)) _b.call(indexKey_2);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        }
        if (!this.multiEntry || !Array.isArray(indexKey)) {
            this.records.add({
                key: indexKey,
                value: newRecord.key,
            });
        }
        else {
            try {
                for (var indexKey_3 = __values(indexKey), indexKey_3_1 = indexKey_3.next(); !indexKey_3_1.done; indexKey_3_1 = indexKey_3.next()) {
                    var individualIndexKey = indexKey_3_1.value;
                    this.records.add({
                        key: individualIndexKey,
                        value: newRecord.key,
                    });
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (indexKey_3_1 && !indexKey_3_1.done && (_c = indexKey_3.return)) _c.call(indexKey_3);
                }
                finally { if (e_5) throw e_5.error; }
            }
        }
    };
    Index.prototype.initialize = function (transaction) {
        var _this = this;
        if (this.initialized) {
            throw new Error("Index already initialized");
        }
        transaction._execRequestAsync({
            operation: function () {
                var e_6, _a;
                try {
                    try {
                        // Create index based on current value of objectstore
                        for (var _b = __values(_this.rawObjectStore.records.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var record = _c.value;
                            _this.storeRecord(record);
                        }
                    }
                    catch (e_6_1) { e_6 = { error: e_6_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_6) throw e_6.error; }
                    }
                    _this.initialized = true;
                }
                catch (err) {
                    // console.error(err);
                    transaction._abort(err.name);
                }
            },
            source: null,
        });
    };
    return Index;
}());
exports.default = Index;

},{"./RecordStore":24,"./errors":29,"./extractKey":30,"./structuredClone":32,"./valueToKey":34}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var MAX_KEY = 9007199254740992;
var KeyGenerator = /** @class */ (function () {
    function KeyGenerator() {
        // This is kind of wrong. Should start at 1 and increment only after record is saved
        this.num = 0;
    }
    KeyGenerator.prototype.next = function () {
        if (this.num >= MAX_KEY) {
            throw new errors_1.ConstraintError();
        }
        this.num += 1;
        return this.num;
    };
    // https://w3c.github.io/IndexedDB/#possibly-update-the-key-generator
    KeyGenerator.prototype.setIfLarger = function (num) {
        var value = Math.floor(Math.min(num, MAX_KEY)) - 1;
        if (value >= this.num) {
            this.num = value + 1;
        }
    };
    return KeyGenerator;
}());
exports.default = KeyGenerator;

},{"./errors":29}],23:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var extractKey_1 = require("./extractKey");
var KeyGenerator_1 = require("./KeyGenerator");
var RecordStore_1 = require("./RecordStore");
var structuredClone_1 = require("./structuredClone");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-object-store
var ObjectStore = /** @class */ (function () {
    function ObjectStore(rawDatabase, name, keyPath, autoIncrement) {
        this.deleted = false;
        this.records = new RecordStore_1.default();
        this.rawIndexes = new Map();
        this.rawDatabase = rawDatabase;
        this.keyGenerator = autoIncrement === true ? new KeyGenerator_1.default() : null;
        this.deleted = false;
        this.name = name;
        this.keyPath = keyPath;
        this.autoIncrement = autoIncrement;
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    ObjectStore.prototype.getKey = function (key) {
        var record = this.records.get(key);
        return record !== undefined ? structuredClone_1.default(record.key) : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-keys-from-an-object-store
    ObjectStore.prototype.getAllKeys = function (range, count) {
        var e_1, _a;
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (var _b = __values(this.records.values(range)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var record = _c.value;
                records.push(structuredClone_1.default(record.key));
                if (records.length >= count) {
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return records;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    ObjectStore.prototype.getValue = function (key) {
        var record = this.records.get(key);
        return record !== undefined ? structuredClone_1.default(record.value) : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-values-from-an-object-store
    ObjectStore.prototype.getAllValues = function (range, count) {
        var e_2, _a;
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (var _b = __values(this.records.values(range)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var record = _c.value;
                records.push(structuredClone_1.default(record.value));
                if (records.length >= count) {
                    break;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return records;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store
    ObjectStore.prototype.storeRecord = function (newRecord, noOverwrite, rollbackLog) {
        var e_3, _a;
        var _this = this;
        if (this.keyPath !== null) {
            var key = extractKey_1.default(this.keyPath, newRecord.value);
            if (key !== undefined) {
                newRecord.key = key;
            }
        }
        if (this.keyGenerator !== null && newRecord.key === undefined) {
            if (rollbackLog) {
                var keyGeneratorBefore_1 = this.keyGenerator.num;
                rollbackLog.push(function () {
                    if (_this.keyGenerator) {
                        _this.keyGenerator.num = keyGeneratorBefore_1;
                    }
                });
            }
            newRecord.key = this.keyGenerator.next();
            // Set in value if keyPath defiend but led to no key
            // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-to-assign-a-key-to-a-value-using-a-key-path
            if (this.keyPath !== null) {
                if (Array.isArray(this.keyPath)) {
                    throw new Error("Cannot have an array key path in an object store with a key generator");
                }
                var remainingKeyPath = this.keyPath;
                var object = newRecord.value;
                var identifier = void 0;
                var i = 0; // Just to run the loop at least once
                while (i >= 0) {
                    if (typeof object !== "object") {
                        throw new errors_1.DataError();
                    }
                    i = remainingKeyPath.indexOf(".");
                    if (i >= 0) {
                        identifier = remainingKeyPath.slice(0, i);
                        remainingKeyPath = remainingKeyPath.slice(i + 1);
                        if (!object.hasOwnProperty(identifier)) {
                            object[identifier] = {};
                        }
                        object = object[identifier];
                    }
                }
                identifier = remainingKeyPath;
                object[identifier] = newRecord.key;
            }
        }
        else if (this.keyGenerator !== null &&
            typeof newRecord.key === "number") {
            this.keyGenerator.setIfLarger(newRecord.key);
        }
        var existingRecord = this.records.get(newRecord.key);
        if (existingRecord) {
            if (noOverwrite) {
                throw new errors_1.ConstraintError();
            }
            this.deleteRecord(newRecord.key, rollbackLog);
        }
        this.records.add(newRecord);
        if (rollbackLog) {
            rollbackLog.push(function () {
                _this.deleteRecord(newRecord.key);
            });
        }
        try {
            // Update indexes
            for (var _b = __values(this.rawIndexes.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var rawIndex = _c.value;
                if (rawIndex.initialized) {
                    rawIndex.storeRecord(newRecord);
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return newRecord.key;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-records-from-an-object-store
    ObjectStore.prototype.deleteRecord = function (key, rollbackLog) {
        var e_4, _a, e_5, _b;
        var _this = this;
        var deletedRecords = this.records.delete(key);
        if (rollbackLog) {
            var _loop_1 = function (record) {
                rollbackLog.push(function () {
                    _this.storeRecord(record, true);
                });
            };
            try {
                for (var deletedRecords_1 = __values(deletedRecords), deletedRecords_1_1 = deletedRecords_1.next(); !deletedRecords_1_1.done; deletedRecords_1_1 = deletedRecords_1.next()) {
                    var record = deletedRecords_1_1.value;
                    _loop_1(record);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (deletedRecords_1_1 && !deletedRecords_1_1.done && (_a = deletedRecords_1.return)) _a.call(deletedRecords_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        try {
            for (var _c = __values(this.rawIndexes.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var rawIndex = _d.value;
                rawIndex.records.deleteByValue(key);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-clearing-an-object-store
    ObjectStore.prototype.clear = function (rollbackLog) {
        var e_6, _a, e_7, _b;
        var _this = this;
        var deletedRecords = this.records.clear();
        if (rollbackLog) {
            var _loop_2 = function (record) {
                rollbackLog.push(function () {
                    _this.storeRecord(record, true);
                });
            };
            try {
                for (var deletedRecords_2 = __values(deletedRecords), deletedRecords_2_1 = deletedRecords_2.next(); !deletedRecords_2_1.done; deletedRecords_2_1 = deletedRecords_2.next()) {
                    var record = deletedRecords_2_1.value;
                    _loop_2(record);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (deletedRecords_2_1 && !deletedRecords_2_1.done && (_a = deletedRecords_2.return)) _a.call(deletedRecords_2);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
        try {
            for (var _c = __values(this.rawIndexes.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var rawIndex = _d.value;
                rawIndex.records.clear();
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
            }
            finally { if (e_7) throw e_7.error; }
        }
    };
    return ObjectStore;
}());
exports.default = ObjectStore;

},{"./KeyGenerator":22,"./RecordStore":24,"./errors":29,"./extractKey":30,"./structuredClone":32}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBKeyRange_1 = require("../FDBKeyRange");
var binarySearch_1 = require("./binarySearch");
var cmp_1 = require("./cmp");
var RecordStore = /** @class */ (function () {
    function RecordStore() {
        this.records = [];
    }
    RecordStore.prototype.get = function (key) {
        if (key instanceof FDBKeyRange_1.default) {
            return binarySearch_1.getByKeyRange(this.records, key);
        }
        return binarySearch_1.getByKey(this.records, key);
    };
    RecordStore.prototype.add = function (newRecord) {
        // Find where to put it so it's sorted by key
        var i;
        if (this.records.length === 0) {
            i = 0;
        }
        else {
            i = binarySearch_1.getIndexByKeyGTE(this.records, newRecord.key);
            if (i === -1) {
                // If no matching key, add to end
                i = this.records.length;
            }
            else {
                // If matching key, advance to appropriate position based on value (used in indexes)
                while (i < this.records.length &&
                    cmp_1.default(this.records[i].key, newRecord.key) === 0) {
                    if (cmp_1.default(this.records[i].value, newRecord.value) !== -1) {
                        // Record value >= newRecord value, so insert here
                        break;
                    }
                    i += 1; // Look at next record
                }
            }
        }
        this.records.splice(i, 0, newRecord);
    };
    RecordStore.prototype.delete = function (key) {
        var deletedRecords = [];
        var isRange = key instanceof FDBKeyRange_1.default;
        while (true) {
            var idx = isRange
                ? binarySearch_1.getIndexByKeyRange(this.records, key)
                : binarySearch_1.getIndexByKey(this.records, key);
            if (idx === -1) {
                break;
            }
            deletedRecords.push(this.records[idx]);
            this.records.splice(idx, 1);
        }
        return deletedRecords;
    };
    RecordStore.prototype.deleteByValue = function (key) {
        var range = key instanceof FDBKeyRange_1.default ? key : FDBKeyRange_1.default.only(key);
        var deletedRecords = [];
        this.records = this.records.filter(function (record) {
            var shouldDelete = range.includes(record.value);
            if (shouldDelete) {
                deletedRecords.push(record);
            }
            return !shouldDelete;
        });
        return deletedRecords;
    };
    RecordStore.prototype.clear = function () {
        var deletedRecords = this.records.slice();
        this.records = [];
        return deletedRecords;
    };
    RecordStore.prototype.values = function (range, direction) {
        var _a;
        var _this = this;
        if (direction === void 0) { direction = "next"; }
        return _a = {},
            _a[Symbol.iterator] = function () {
                var i;
                if (direction === "next") {
                    i = 0;
                    if (range !== undefined && range.lower !== undefined) {
                        while (_this.records[i] !== undefined) {
                            var cmpResult = cmp_1.default(_this.records[i].key, range.lower);
                            if (cmpResult === 1 ||
                                (cmpResult === 0 && !range.lowerOpen)) {
                                break;
                            }
                            i += 1;
                        }
                    }
                }
                else {
                    i = _this.records.length - 1;
                    if (range !== undefined && range.upper !== undefined) {
                        while (_this.records[i] !== undefined) {
                            var cmpResult = cmp_1.default(_this.records[i].key, range.upper);
                            if (cmpResult === -1 ||
                                (cmpResult === 0 && !range.upperOpen)) {
                                break;
                            }
                            i -= 1;
                        }
                    }
                }
                return {
                    next: function () {
                        var done;
                        var value;
                        if (direction === "next") {
                            value = _this.records[i];
                            done = i >= _this.records.length;
                            i += 1;
                            if (!done &&
                                range !== undefined &&
                                range.upper !== undefined) {
                                var cmpResult = cmp_1.default(value.key, range.upper);
                                done =
                                    cmpResult === 1 ||
                                        (cmpResult === 0 && range.upperOpen);
                                if (done) {
                                    value = undefined;
                                }
                            }
                        }
                        else {
                            value = _this.records[i];
                            done = i < 0;
                            i -= 1;
                            if (!done &&
                                range !== undefined &&
                                range.lower !== undefined) {
                                var cmpResult = cmp_1.default(value.key, range.lower);
                                done =
                                    cmpResult === -1 ||
                                        (cmpResult === 0 && range.lowerOpen);
                                if (done) {
                                    value = undefined;
                                }
                            }
                        }
                        // The weird "as IteratorResult<Record>" is needed because of
                        // https://github.com/Microsoft/TypeScript/issues/11375 and
                        // https://github.com/Microsoft/TypeScript/issues/2983
                        // tslint:disable-next-line no-object-literal-type-assertion
                        return {
                            done: done,
                            value: value,
                        };
                    },
                };
            },
            _a;
    };
    return RecordStore;
}());
exports.default = RecordStore;

},{"../FDBKeyRange":11,"./binarySearch":25,"./cmp":27}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cmp_1 = require("./cmp");
/**
 * Classic binary search implementation. Returns the index where the key
 * should be inserted, assuming the records list is ordered.
 */
function binarySearch(records, key) {
    var low = 0;
    var high = records.length;
    var mid;
    while (low < high) {
        // tslint:disable-next-line:no-bitwise
        mid = (low + high) >>> 1; // like Math.floor((low + high) / 2) but fast
        if (cmp_1.default(records[mid].key, key) < 0) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    return low;
}
/**
 * Equivalent to `records.findIndex(record => cmp(record.key, key) === 0)`
 */
function getIndexByKey(records, key) {
    var idx = binarySearch(records, key);
    var record = records[idx];
    if (record && cmp_1.default(record.key, key) === 0) {
        return idx;
    }
    return -1;
}
exports.getIndexByKey = getIndexByKey;
/**
 * Equivalent to `records.find(record => cmp(record.key, key) === 0)`
 */
function getByKey(records, key) {
    var idx = getIndexByKey(records, key);
    return records[idx];
}
exports.getByKey = getByKey;
/**
 * Equivalent to `records.findIndex(record => key.includes(record.key))`
 */
function getIndexByKeyRange(records, keyRange) {
    var lowerIdx = typeof keyRange.lower === "undefined"
        ? 0
        : binarySearch(records, keyRange.lower);
    var upperIdx = typeof keyRange.upper === "undefined"
        ? records.length - 1
        : binarySearch(records, keyRange.upper);
    for (var i = lowerIdx; i <= upperIdx; i++) {
        var record = records[i];
        if (record && keyRange.includes(record.key)) {
            return i;
        }
    }
    return -1;
}
exports.getIndexByKeyRange = getIndexByKeyRange;
/**
 * Equivalent to `records.find(record => key.includes(record.key))`
 */
function getByKeyRange(records, keyRange) {
    var idx = getIndexByKeyRange(records, keyRange);
    return records[idx];
}
exports.getByKeyRange = getByKeyRange;
/**
 * Equivalent to `records.findIndex(record => cmp(record.key, key) >= 0)`
 */
function getIndexByKeyGTE(records, key) {
    var idx = binarySearch(records, key);
    var record = records[idx];
    if (record && cmp_1.default(record.key, key) >= 0) {
        return idx;
    }
    return -1;
}
exports.getIndexByKeyGTE = getIndexByKeyGTE;

},{"./cmp":27}],26:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
// http://w3c.github.io/IndexedDB/#check-that-a-key-could-be-injected-into-a-value
var canInjectKey = function (keyPath, value) {
    var e_1, _a;
    if (Array.isArray(keyPath)) {
        // tslint:disable-next-line max-line-length
        throw new Error("The key paths used in this section are always strings and never sequences, since it is not possible to create a object store which has a key generator and also has a key path that is a sequence.");
    }
    var identifiers = keyPath.split(".");
    if (identifiers.length === 0) {
        throw new Error("Assert: identifiers is not empty");
    }
    identifiers.pop();
    try {
        for (var identifiers_1 = __values(identifiers), identifiers_1_1 = identifiers_1.next(); !identifiers_1_1.done; identifiers_1_1 = identifiers_1.next()) {
            var identifier = identifiers_1_1.value;
            if (typeof value !== "object" && !Array.isArray(value)) {
                return false;
            }
            var hop = value.hasOwnProperty(identifier);
            if (!hop) {
                return true;
            }
            value = value[identifier];
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (identifiers_1_1 && !identifiers_1_1.done && (_a = identifiers_1.return)) _a.call(identifiers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return typeof value === "object" || Array.isArray(value);
};
exports.default = canInjectKey;

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var valueToKey_1 = require("./valueToKey");
var getType = function (x) {
    if (typeof x === "number") {
        return "Number";
    }
    if (x instanceof Date) {
        return "Date";
    }
    if (Array.isArray(x)) {
        return "Array";
    }
    if (typeof x === "string") {
        return "String";
    }
    if (x instanceof ArrayBuffer) {
        return "Binary";
    }
    throw new errors_1.DataError();
};
// https://w3c.github.io/IndexedDB/#compare-two-keys
var cmp = function (first, second) {
    if (second === undefined) {
        throw new TypeError();
    }
    first = valueToKey_1.default(first);
    second = valueToKey_1.default(second);
    var t1 = getType(first);
    var t2 = getType(second);
    if (t1 !== t2) {
        if (t1 === "Array") {
            return 1;
        }
        if (t1 === "Binary" &&
            (t2 === "String" || t2 === "Date" || t2 === "Number")) {
            return 1;
        }
        if (t1 === "String" && (t2 === "Date" || t2 === "Number")) {
            return 1;
        }
        if (t1 === "Date" && t2 === "Number") {
            return 1;
        }
        return -1;
    }
    if (t1 === "Binary") {
        first = new Uint8Array(first);
        second = new Uint8Array(second);
    }
    if (t1 === "Array" || t1 === "Binary") {
        var length_1 = Math.min(first.length, second.length);
        for (var i = 0; i < length_1; i++) {
            var result = cmp(first[i], second[i]);
            if (result !== 0) {
                return result;
            }
        }
        if (first.length > second.length) {
            return 1;
        }
        if (first.length < second.length) {
            return -1;
        }
        return 0;
    }
    if (t1 === "Date") {
        if (first.getTime() === second.getTime()) {
            return 0;
        }
    }
    else {
        if (first === second) {
            return 0;
        }
    }
    return first > second ? 1 : -1;
};
exports.default = cmp;

},{"./errors":29,"./valueToKey":34}],28:[function(require,module,exports){
"use strict";
// https://heycam.github.io/webidl/#EnforceRange
Object.defineProperty(exports, "__esModule", { value: true });
var enforceRange = function (num, type) {
    var min = 0;
    var max = type === "unsigned long" ? 4294967295 : 9007199254740991;
    if (isNaN(num) || num < min || num > max) {
        throw new TypeError();
    }
    if (num >= 0) {
        return Math.floor(num);
    }
};
exports.default = enforceRange;

},{}],29:[function(require,module,exports){
"use strict";
/* tslint:disable: max-classes-per-file max-line-length */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var messages = {
    AbortError: "A request was aborted, for example through a call to IDBTransaction.abort.",
    ConstraintError: "A mutation operation in the transaction failed because a constraint was not satisfied. For example, an object such as an object store or index already exists and a request attempted to create a new one.",
    DataCloneError: "The data being stored could not be cloned by the internal structured cloning algorithm.",
    DataError: "Data provided to an operation does not meet requirements.",
    InvalidAccessError: "An invalid operation was performed on an object. For example transaction creation attempt was made, but an empty scope was provided.",
    InvalidStateError: "An operation was called on an object on which it is not allowed or at a time when it is not allowed. Also occurs if a request is made on a source object that has been deleted or removed. Use TransactionInactiveError or ReadOnlyError when possible, as they are more specific variations of InvalidStateError.",
    NotFoundError: "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.",
    ReadOnlyError: 'The mutating operation was attempted in a "readonly" transaction.',
    TransactionInactiveError: "A request was placed against a transaction which is currently not active, or which is finished.",
    VersionError: "An attempt was made to open a database using a lower version than the existing version.",
};
var AbortError = /** @class */ (function (_super) {
    __extends(AbortError, _super);
    function AbortError(message) {
        if (message === void 0) { message = messages.AbortError; }
        var _this = _super.call(this) || this;
        _this.name = "AbortError";
        _this.message = message;
        return _this;
    }
    return AbortError;
}(Error));
exports.AbortError = AbortError;
var ConstraintError = /** @class */ (function (_super) {
    __extends(ConstraintError, _super);
    function ConstraintError(message) {
        if (message === void 0) { message = messages.ConstraintError; }
        var _this = _super.call(this) || this;
        _this.name = "ConstraintError";
        _this.message = message;
        return _this;
    }
    return ConstraintError;
}(Error));
exports.ConstraintError = ConstraintError;
var DataCloneError = /** @class */ (function (_super) {
    __extends(DataCloneError, _super);
    function DataCloneError(message) {
        if (message === void 0) { message = messages.DataCloneError; }
        var _this = _super.call(this) || this;
        _this.name = "DataCloneError";
        _this.message = message;
        return _this;
    }
    return DataCloneError;
}(Error));
exports.DataCloneError = DataCloneError;
var DataError = /** @class */ (function (_super) {
    __extends(DataError, _super);
    function DataError(message) {
        if (message === void 0) { message = messages.DataError; }
        var _this = _super.call(this) || this;
        _this.name = "DataError";
        _this.message = message;
        return _this;
    }
    return DataError;
}(Error));
exports.DataError = DataError;
var InvalidAccessError = /** @class */ (function (_super) {
    __extends(InvalidAccessError, _super);
    function InvalidAccessError(message) {
        if (message === void 0) { message = messages.InvalidAccessError; }
        var _this = _super.call(this) || this;
        _this.name = "InvalidAccessError";
        _this.message = message;
        return _this;
    }
    return InvalidAccessError;
}(Error));
exports.InvalidAccessError = InvalidAccessError;
var InvalidStateError = /** @class */ (function (_super) {
    __extends(InvalidStateError, _super);
    function InvalidStateError(message) {
        if (message === void 0) { message = messages.InvalidStateError; }
        var _this = _super.call(this) || this;
        _this.name = "InvalidStateError";
        _this.message = message;
        return _this;
    }
    return InvalidStateError;
}(Error));
exports.InvalidStateError = InvalidStateError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message) {
        if (message === void 0) { message = messages.NotFoundError; }
        var _this = _super.call(this) || this;
        _this.name = "NotFoundError";
        _this.message = message;
        return _this;
    }
    return NotFoundError;
}(Error));
exports.NotFoundError = NotFoundError;
var ReadOnlyError = /** @class */ (function (_super) {
    __extends(ReadOnlyError, _super);
    function ReadOnlyError(message) {
        if (message === void 0) { message = messages.ReadOnlyError; }
        var _this = _super.call(this) || this;
        _this.name = "ReadOnlyError";
        _this.message = message;
        return _this;
    }
    return ReadOnlyError;
}(Error));
exports.ReadOnlyError = ReadOnlyError;
var TransactionInactiveError = /** @class */ (function (_super) {
    __extends(TransactionInactiveError, _super);
    function TransactionInactiveError(message) {
        if (message === void 0) { message = messages.TransactionInactiveError; }
        var _this = _super.call(this) || this;
        _this.name = "TransactionInactiveError";
        _this.message = message;
        return _this;
    }
    return TransactionInactiveError;
}(Error));
exports.TransactionInactiveError = TransactionInactiveError;
var VersionError = /** @class */ (function (_super) {
    __extends(VersionError, _super);
    function VersionError(message) {
        if (message === void 0) { message = messages.VersionError; }
        var _this = _super.call(this) || this;
        _this.name = "VersionError";
        _this.message = message;
        return _this;
    }
    return VersionError;
}(Error));
exports.VersionError = VersionError;

},{}],30:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var valueToKey_1 = require("./valueToKey");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-extracting-a-key-from-a-value-using-a-key-path
var extractKey = function (keyPath, value) {
    var e_1, _a;
    if (Array.isArray(keyPath)) {
        var result = [];
        try {
            for (var keyPath_1 = __values(keyPath), keyPath_1_1 = keyPath_1.next(); !keyPath_1_1.done; keyPath_1_1 = keyPath_1.next()) {
                var item = keyPath_1_1.value;
                // This doesn't make sense to me based on the spec, but it is needed to pass the W3C KeyPath tests (see same
                // comment in validateKeyPath)
                if (item !== undefined &&
                    item !== null &&
                    typeof item !== "string" &&
                    item.toString) {
                    item = item.toString();
                }
                result.push(valueToKey_1.default(extractKey(item, value)));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keyPath_1_1 && !keyPath_1_1.done && (_a = keyPath_1.return)) _a.call(keyPath_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    }
    if (keyPath === "") {
        return value;
    }
    var remainingKeyPath = keyPath;
    var object = value;
    while (remainingKeyPath !== null) {
        var identifier = void 0;
        var i = remainingKeyPath.indexOf(".");
        if (i >= 0) {
            identifier = remainingKeyPath.slice(0, i);
            remainingKeyPath = remainingKeyPath.slice(i + 1);
        }
        else {
            identifier = remainingKeyPath;
            remainingKeyPath = null;
        }
        if (!object.hasOwnProperty(identifier)) {
            return;
        }
        object = object[identifier];
    }
    return object;
};
exports.default = extractKey;

},{"./valueToKey":34}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Would be nicer to sublcass Array, but I'd have to sacrifice Node 4 support to do that.
var fakeDOMStringList = function (arr) {
    var arr2 = arr.slice();
    Object.defineProperty(arr2, "contains", {
        // tslint:disable-next-line object-literal-shorthand
        value: function (value) { return arr2.indexOf(value) >= 0; },
    });
    Object.defineProperty(arr2, "item", {
        // tslint:disable-next-line object-literal-shorthand
        value: function (i) { return arr2[i]; },
    });
    return arr2;
};
exports.default = fakeDOMStringList;

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var realisticStructuredClone = require("realistic-structured-clone"); // tslint:disable-line no-var-requires
var errors_1 = require("./errors");
var structuredClone = function (input) {
    try {
        return realisticStructuredClone(input);
    }
    catch (err) {
        throw new errors_1.DataCloneError();
    }
};
exports.default = structuredClone;

},{"./errors":29,"realistic-structured-clone":36}],33:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-valid-key-path
var validateKeyPath = function (keyPath, parent) {
    var e_1, _a, e_2, _b;
    // This doesn't make sense to me based on the spec, but it is needed to pass the W3C KeyPath tests (see same
    // comment in extractKey)
    if (keyPath !== undefined &&
        keyPath !== null &&
        typeof keyPath !== "string" &&
        keyPath.toString &&
        (parent === "array" || !Array.isArray(keyPath))) {
        keyPath = keyPath.toString();
    }
    if (typeof keyPath === "string") {
        if (keyPath === "" && parent !== "string") {
            return;
        }
        try {
            // https://mathiasbynens.be/demo/javascript-identifier-regex for ECMAScript 5.1 / Unicode v7.0.0, with
            // reserved words at beginning removed
            // tslint:disable-next-line max-line-length
            var validIdentifierRegex = /^(?:[\$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC])(?:[\$0-9A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC])*$/;
            if (keyPath.length >= 1 && validIdentifierRegex.test(keyPath)) {
                return;
            }
        }
        catch (err) {
            throw new SyntaxError(err.message);
        }
        if (keyPath.indexOf(" ") >= 0) {
            throw new SyntaxError("The keypath argument contains an invalid key path (no spaces allowed).");
        }
    }
    if (Array.isArray(keyPath) && keyPath.length > 0) {
        if (parent) {
            // No nested arrays
            throw new SyntaxError("The keypath argument contains an invalid key path (nested arrays).");
        }
        try {
            for (var keyPath_1 = __values(keyPath), keyPath_1_1 = keyPath_1.next(); !keyPath_1_1.done; keyPath_1_1 = keyPath_1.next()) {
                var part = keyPath_1_1.value;
                validateKeyPath(part, "array");
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keyPath_1_1 && !keyPath_1_1.done && (_a = keyPath_1.return)) _a.call(keyPath_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return;
    }
    else if (typeof keyPath === "string" && keyPath.indexOf(".") >= 0) {
        keyPath = keyPath.split(".");
        try {
            for (var keyPath_2 = __values(keyPath), keyPath_2_1 = keyPath_2.next(); !keyPath_2_1.done; keyPath_2_1 = keyPath_2.next()) {
                var part = keyPath_2_1.value;
                validateKeyPath(part, "string");
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (keyPath_2_1 && !keyPath_2_1.done && (_b = keyPath_2.return)) _b.call(keyPath_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return;
    }
    throw new SyntaxError();
};
exports.default = validateKeyPath;

},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
// https://w3c.github.io/IndexedDB/#convert-a-value-to-a-input
var valueToKey = function (input, seen) {
    if (typeof input === "number") {
        if (isNaN(input)) {
            throw new errors_1.DataError();
        }
        return input;
    }
    else if (input instanceof Date) {
        var ms = input.valueOf();
        if (isNaN(ms)) {
            throw new errors_1.DataError();
        }
        return new Date(ms);
    }
    else if (typeof input === "string") {
        return input;
    }
    else if (input instanceof ArrayBuffer ||
        (typeof ArrayBuffer !== "undefined" &&
            ArrayBuffer.isView &&
            ArrayBuffer.isView(input))) {
        if (input instanceof ArrayBuffer) {
            return new Uint8Array(input).buffer;
        }
        return new Uint8Array(input.buffer).buffer;
    }
    else if (Array.isArray(input)) {
        if (seen === undefined) {
            seen = new Set();
        }
        else if (seen.has(input)) {
            throw new errors_1.DataError();
        }
        seen.add(input);
        var keys = [];
        for (var i = 0; i < input.length; i++) {
            var hop = input.hasOwnProperty(i);
            if (!hop) {
                throw new errors_1.DataError();
            }
            var entry = input[i];
            var key = valueToKey(entry, seen);
            keys.push(key);
        }
        return keys;
    }
    else {
        throw new errors_1.DataError();
    }
};
exports.default = valueToKey;

},{"./errors":29}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBKeyRange_1 = require("../FDBKeyRange");
var errors_1 = require("./errors");
var valueToKey_1 = require("./valueToKey");
// http://w3c.github.io/IndexedDB/#convert-a-value-to-a-key-range
var valueToKeyRange = function (value, nullDisallowedFlag) {
    if (nullDisallowedFlag === void 0) { nullDisallowedFlag = false; }
    if (value instanceof FDBKeyRange_1.default) {
        return value;
    }
    if (value === null || value === undefined) {
        if (nullDisallowedFlag) {
            throw new errors_1.DataError();
        }
        return new FDBKeyRange_1.default(undefined, undefined, false, false);
    }
    var key = valueToKey_1.default(value);
    return FDBKeyRange_1.default.only(key);
};
exports.default = valueToKeyRange;

},{"../FDBKeyRange":11,"./errors":29,"./valueToKey":34}],36:[function(require,module,exports){
(function (global,Buffer){(function (){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.realisticStructuredClone = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(_dereq_,module,exports){
'use strict';

_dereq_('core-js/fn/array/includes');
_dereq_('core-js/fn/object/values');
var DOMException = _dereq_('domexception');
var Typeson = _dereq_('typeson');
var structuredCloningThrowing = _dereq_('typeson-registry/dist/presets/structured-cloning-throwing');

// http://stackoverflow.com/a/33268326/786644 - works in browser, worker, and Node.js
var globalVar = typeof window !== 'undefined' ? window : typeof WorkerGlobalScope !== 'undefined' ? self : typeof global !== 'undefined' ? global : Function('return this;')();

if (!globalVar.DOMException) {
    globalVar.DOMException = DOMException;
}

var TSON = new Typeson().register(structuredCloningThrowing);

function realisticStructuredClone(obj) {
    return TSON.revive(TSON.encapsulate(obj));
}

module.exports = realisticStructuredClone;

},{"core-js/fn/array/includes":2,"core-js/fn/object/values":3,"domexception":44,"typeson":47,"typeson-registry/dist/presets/structured-cloning-throwing":46}],2:[function(_dereq_,module,exports){
'use strict';

_dereq_('../../modules/es7.array.includes');
module.exports = _dereq_('../../modules/_core').Array.includes;

},{"../../modules/_core":9,"../../modules/es7.array.includes":39}],3:[function(_dereq_,module,exports){
'use strict';

_dereq_('../../modules/es7.object.values');
module.exports = _dereq_('../../modules/_core').Object.values;

},{"../../modules/_core":9,"../../modules/es7.object.values":40}],4:[function(_dereq_,module,exports){
'use strict';

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],5:[function(_dereq_,module,exports){
'use strict';

// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = _dereq_('./_wks')('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) _dereq_('./_hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};

},{"./_hide":19,"./_wks":38}],6:[function(_dereq_,module,exports){
'use strict';

var isObject = _dereq_('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":22}],7:[function(_dereq_,module,exports){
'use strict';

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = _dereq_('./_to-iobject');
var toLength = _dereq_('./_to-length');
var toAbsoluteIndex = _dereq_('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
      // Array#indexOf ignores holes, Array#includes - not
    } else for (; length > index; index++) {
      if (IS_INCLUDES || index in O) {
        if (O[index] === el) return IS_INCLUDES || index || 0;
      }
    }return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":32,"./_to-iobject":34,"./_to-length":35}],8:[function(_dereq_,module,exports){
"use strict";

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],9:[function(_dereq_,module,exports){
'use strict';

var core = module.exports = { version: '2.5.3' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],10:[function(_dereq_,module,exports){
'use strict';

// optional / simple context binding
var aFunction = _dereq_('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1:
      return function (a) {
        return fn.call(that, a);
      };
    case 2:
      return function (a, b) {
        return fn.call(that, a, b);
      };
    case 3:
      return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
  }
  return function () /* ...args */{
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":4}],11:[function(_dereq_,module,exports){
"use strict";

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],12:[function(_dereq_,module,exports){
'use strict';

// Thank's IE8 for his funny defineProperty
module.exports = !_dereq_('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function get() {
      return 7;
    } }).a != 7;
});

},{"./_fails":16}],13:[function(_dereq_,module,exports){
'use strict';

var isObject = _dereq_('./_is-object');
var document = _dereq_('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":17,"./_is-object":22}],14:[function(_dereq_,module,exports){
'use strict';

// IE 8- don't enum bug keys
module.exports = 'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'.split(',');

},{}],15:[function(_dereq_,module,exports){
'use strict';

var global = _dereq_('./_global');
var core = _dereq_('./_core');
var hide = _dereq_('./_hide');
var redefine = _dereq_('./_redefine');
var ctx = _dereq_('./_ctx');
var PROTOTYPE = 'prototype';

var $export = function $export(type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1; // forced
$export.G = 2; // global
$export.S = 4; // static
$export.P = 8; // proto
$export.B = 16; // bind
$export.W = 32; // wrap
$export.U = 64; // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":9,"./_ctx":10,"./_global":17,"./_hide":19,"./_redefine":29}],16:[function(_dereq_,module,exports){
"use strict";

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],17:[function(_dereq_,module,exports){
'use strict';

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self
// eslint-disable-next-line no-new-func
: Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],18:[function(_dereq_,module,exports){
"use strict";

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],19:[function(_dereq_,module,exports){
'use strict';

var dP = _dereq_('./_object-dp');
var createDesc = _dereq_('./_property-desc');
module.exports = _dereq_('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":12,"./_object-dp":23,"./_property-desc":28}],20:[function(_dereq_,module,exports){
'use strict';

module.exports = !_dereq_('./_descriptors') && !_dereq_('./_fails')(function () {
  return Object.defineProperty(_dereq_('./_dom-create')('div'), 'a', { get: function get() {
      return 7;
    } }).a != 7;
});

},{"./_descriptors":12,"./_dom-create":13,"./_fails":16}],21:[function(_dereq_,module,exports){
'use strict';

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = _dereq_('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":8}],22:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

module.exports = function (it) {
  return (typeof it === 'undefined' ? 'undefined' : _typeof(it)) === 'object' ? it !== null : typeof it === 'function';
};

},{}],23:[function(_dereq_,module,exports){
'use strict';

var anObject = _dereq_('./_an-object');
var IE8_DOM_DEFINE = _dereq_('./_ie8-dom-define');
var toPrimitive = _dereq_('./_to-primitive');
var dP = Object.defineProperty;

exports.f = _dereq_('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) {/* empty */}
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":6,"./_descriptors":12,"./_ie8-dom-define":20,"./_to-primitive":36}],24:[function(_dereq_,module,exports){
'use strict';

var has = _dereq_('./_has');
var toIObject = _dereq_('./_to-iobject');
var arrayIndexOf = _dereq_('./_array-includes')(false);
var IE_PROTO = _dereq_('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) {
    if (key != IE_PROTO) has(O, key) && result.push(key);
  } // Don't enum bug & hidden keys
  while (names.length > i) {
    if (has(O, key = names[i++])) {
      ~arrayIndexOf(result, key) || result.push(key);
    }
  }return result;
};

},{"./_array-includes":7,"./_has":18,"./_shared-key":30,"./_to-iobject":34}],25:[function(_dereq_,module,exports){
'use strict';

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = _dereq_('./_object-keys-internal');
var enumBugKeys = _dereq_('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":14,"./_object-keys-internal":24}],26:[function(_dereq_,module,exports){
"use strict";

exports.f = {}.propertyIsEnumerable;

},{}],27:[function(_dereq_,module,exports){
'use strict';

var getKeys = _dereq_('./_object-keys');
var toIObject = _dereq_('./_to-iobject');
var isEnum = _dereq_('./_object-pie').f;
module.exports = function (isEntries) {
  return function (it) {
    var O = toIObject(it);
    var keys = getKeys(O);
    var length = keys.length;
    var i = 0;
    var result = [];
    var key;
    while (length > i) {
      if (isEnum.call(O, key = keys[i++])) {
        result.push(isEntries ? [key, O[key]] : O[key]);
      }
    }return result;
  };
};

},{"./_object-keys":25,"./_object-pie":26,"./_to-iobject":34}],28:[function(_dereq_,module,exports){
"use strict";

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],29:[function(_dereq_,module,exports){
'use strict';

var global = _dereq_('./_global');
var hide = _dereq_('./_hide');
var has = _dereq_('./_has');
var SRC = _dereq_('./_uid')('src');
var TO_STRING = 'toString';
var $toString = Function[TO_STRING];
var TPL = ('' + $toString).split(TO_STRING);

_dereq_('./_core').inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});

},{"./_core":9,"./_global":17,"./_has":18,"./_hide":19,"./_uid":37}],30:[function(_dereq_,module,exports){
'use strict';

var shared = _dereq_('./_shared')('keys');
var uid = _dereq_('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":31,"./_uid":37}],31:[function(_dereq_,module,exports){
'use strict';

var global = _dereq_('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};

},{"./_global":17}],32:[function(_dereq_,module,exports){
'use strict';

var toInteger = _dereq_('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":33}],33:[function(_dereq_,module,exports){
"use strict";

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],34:[function(_dereq_,module,exports){
'use strict';

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = _dereq_('./_iobject');
var defined = _dereq_('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":11,"./_iobject":21}],35:[function(_dereq_,module,exports){
'use strict';

// 7.1.15 ToLength
var toInteger = _dereq_('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":33}],36:[function(_dereq_,module,exports){
'use strict';

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = _dereq_('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":22}],37:[function(_dereq_,module,exports){
'use strict';

var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],38:[function(_dereq_,module,exports){
'use strict';

var store = _dereq_('./_shared')('wks');
var uid = _dereq_('./_uid');
var _Symbol = _dereq_('./_global').Symbol;
var USE_SYMBOL = typeof _Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] = USE_SYMBOL && _Symbol[name] || (USE_SYMBOL ? _Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":17,"./_shared":31,"./_uid":37}],39:[function(_dereq_,module,exports){
'use strict';
// https://github.com/tc39/Array.prototype.includes

var $export = _dereq_('./_export');
var $includes = _dereq_('./_array-includes')(true);

$export($export.P, 'Array', {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

_dereq_('./_add-to-unscopables')('includes');

},{"./_add-to-unscopables":5,"./_array-includes":7,"./_export":15}],40:[function(_dereq_,module,exports){
'use strict';

// https://github.com/tc39/proposal-object-values-entries
var $export = _dereq_('./_export');
var $values = _dereq_('./_object-to-array')(false);

$export($export.S, 'Object', {
  values: function values(it) {
    return $values(it);
  }
});

},{"./_export":15,"./_object-to-array":27}],41:[function(_dereq_,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var legacyErrorCodes = _dereq_("./legacy-error-codes.json");
var idlUtils = _dereq_("./utils.js");

exports.implementation = function () {
  function DOMExceptionImpl(_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        message = _ref2[0],
        name = _ref2[1];

    _classCallCheck(this, DOMExceptionImpl);

    this.name = name;
    this.message = message;
  }

  _createClass(DOMExceptionImpl, [{
    key: "code",
    get: function get() {
      return legacyErrorCodes[this.name] || 0;
    }
  }]);

  return DOMExceptionImpl;
}();

// A proprietary V8 extension that causes the stack property to appear.
exports.init = function (impl) {
  if (Error.captureStackTrace) {
    var wrapper = idlUtils.wrapperForImpl(impl);
    Error.captureStackTrace(wrapper, wrapper.constructor);
  }
};

},{"./legacy-error-codes.json":43,"./utils.js":45}],42:[function(_dereq_,module,exports){
"use strict";

var conversions = _dereq_("webidl-conversions");
var utils = _dereq_("./utils.js");

var impl = utils.implSymbol;

function DOMException() {
  var args = [];
  for (var i = 0; i < arguments.length && i < 2; ++i) {
    args[i] = arguments[i];
  }

  if (args[0] !== undefined) {
    args[0] = conversions["DOMString"](args[0], { context: "Failed to construct 'DOMException': parameter 1" });
  } else {
    args[0] = "";
  }

  if (args[1] !== undefined) {
    args[1] = conversions["DOMString"](args[1], { context: "Failed to construct 'DOMException': parameter 2" });
  } else {
    args[1] = "Error";
  }

  iface.setup(this, args);
}

Object.defineProperty(DOMException, "prototype", {
  value: DOMException.prototype,
  writable: false,
  enumerable: false,
  configurable: false
});

Object.defineProperty(DOMException.prototype, "name", {
  get: function get() {
    return this[impl]["name"];
  },


  enumerable: true,
  configurable: true
});

Object.defineProperty(DOMException.prototype, "message", {
  get: function get() {
    return this[impl]["message"];
  },


  enumerable: true,
  configurable: true
});

Object.defineProperty(DOMException.prototype, "code", {
  get: function get() {
    return this[impl]["code"];
  },


  enumerable: true,
  configurable: true
});

Object.defineProperty(DOMException, "INDEX_SIZE_ERR", {
  value: 1,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "INDEX_SIZE_ERR", {
  value: 1,
  enumerable: true
});

Object.defineProperty(DOMException, "DOMSTRING_SIZE_ERR", {
  value: 2,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "DOMSTRING_SIZE_ERR", {
  value: 2,
  enumerable: true
});

Object.defineProperty(DOMException, "HIERARCHY_REQUEST_ERR", {
  value: 3,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "HIERARCHY_REQUEST_ERR", {
  value: 3,
  enumerable: true
});

Object.defineProperty(DOMException, "WRONG_DOCUMENT_ERR", {
  value: 4,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "WRONG_DOCUMENT_ERR", {
  value: 4,
  enumerable: true
});

Object.defineProperty(DOMException, "INVALID_CHARACTER_ERR", {
  value: 5,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "INVALID_CHARACTER_ERR", {
  value: 5,
  enumerable: true
});

Object.defineProperty(DOMException, "NO_DATA_ALLOWED_ERR", {
  value: 6,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "NO_DATA_ALLOWED_ERR", {
  value: 6,
  enumerable: true
});

Object.defineProperty(DOMException, "NO_MODIFICATION_ALLOWED_ERR", {
  value: 7,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "NO_MODIFICATION_ALLOWED_ERR", {
  value: 7,
  enumerable: true
});

Object.defineProperty(DOMException, "NOT_FOUND_ERR", {
  value: 8,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "NOT_FOUND_ERR", {
  value: 8,
  enumerable: true
});

Object.defineProperty(DOMException, "NOT_SUPPORTED_ERR", {
  value: 9,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "NOT_SUPPORTED_ERR", {
  value: 9,
  enumerable: true
});

Object.defineProperty(DOMException, "INUSE_ATTRIBUTE_ERR", {
  value: 10,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "INUSE_ATTRIBUTE_ERR", {
  value: 10,
  enumerable: true
});

Object.defineProperty(DOMException, "INVALID_STATE_ERR", {
  value: 11,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "INVALID_STATE_ERR", {
  value: 11,
  enumerable: true
});

Object.defineProperty(DOMException, "SYNTAX_ERR", {
  value: 12,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "SYNTAX_ERR", {
  value: 12,
  enumerable: true
});

Object.defineProperty(DOMException, "INVALID_MODIFICATION_ERR", {
  value: 13,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "INVALID_MODIFICATION_ERR", {
  value: 13,
  enumerable: true
});

Object.defineProperty(DOMException, "NAMESPACE_ERR", {
  value: 14,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "NAMESPACE_ERR", {
  value: 14,
  enumerable: true
});

Object.defineProperty(DOMException, "INVALID_ACCESS_ERR", {
  value: 15,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "INVALID_ACCESS_ERR", {
  value: 15,
  enumerable: true
});

Object.defineProperty(DOMException, "VALIDATION_ERR", {
  value: 16,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "VALIDATION_ERR", {
  value: 16,
  enumerable: true
});

Object.defineProperty(DOMException, "TYPE_MISMATCH_ERR", {
  value: 17,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "TYPE_MISMATCH_ERR", {
  value: 17,
  enumerable: true
});

Object.defineProperty(DOMException, "SECURITY_ERR", {
  value: 18,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "SECURITY_ERR", {
  value: 18,
  enumerable: true
});

Object.defineProperty(DOMException, "NETWORK_ERR", {
  value: 19,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "NETWORK_ERR", {
  value: 19,
  enumerable: true
});

Object.defineProperty(DOMException, "ABORT_ERR", {
  value: 20,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "ABORT_ERR", {
  value: 20,
  enumerable: true
});

Object.defineProperty(DOMException, "URL_MISMATCH_ERR", {
  value: 21,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "URL_MISMATCH_ERR", {
  value: 21,
  enumerable: true
});

Object.defineProperty(DOMException, "QUOTA_EXCEEDED_ERR", {
  value: 22,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "QUOTA_EXCEEDED_ERR", {
  value: 22,
  enumerable: true
});

Object.defineProperty(DOMException, "TIMEOUT_ERR", {
  value: 23,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "TIMEOUT_ERR", {
  value: 23,
  enumerable: true
});

Object.defineProperty(DOMException, "INVALID_NODE_TYPE_ERR", {
  value: 24,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "INVALID_NODE_TYPE_ERR", {
  value: 24,
  enumerable: true
});

Object.defineProperty(DOMException, "DATA_CLONE_ERR", {
  value: 25,
  enumerable: true
});
Object.defineProperty(DOMException.prototype, "DATA_CLONE_ERR", {
  value: 25,
  enumerable: true
});

Object.defineProperty(DOMException.prototype, Symbol.toStringTag, {
  value: "DOMException",
  writable: false,
  enumerable: false,
  configurable: true
});

var iface = {
  mixedInto: [],
  is: function is(obj) {
    if (obj) {
      if (obj[impl] instanceof Impl.implementation) {
        return true;
      }
      for (var i = 0; i < module.exports.mixedInto.length; ++i) {
        if (obj instanceof module.exports.mixedInto[i]) {
          return true;
        }
      }
    }
    return false;
  },
  isImpl: function isImpl(obj) {
    if (obj) {
      if (obj instanceof Impl.implementation) {
        return true;
      }

      var wrapper = utils.wrapperForImpl(obj);
      for (var i = 0; i < module.exports.mixedInto.length; ++i) {
        if (wrapper instanceof module.exports.mixedInto[i]) {
          return true;
        }
      }
    }
    return false;
  },
  convert: function convert(obj) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$context = _ref.context,
        context = _ref$context === undefined ? "The provided value" : _ref$context;

    if (module.exports.is(obj)) {
      return utils.implForWrapper(obj);
    }
    throw new TypeError(context + " is not of type 'DOMException'.");
  },
  create: function create(constructorArgs, privateData) {
    var obj = Object.create(DOMException.prototype);
    this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl: function createImpl(constructorArgs, privateData) {
    var obj = Object.create(DOMException.prototype);
    this.setup(obj, constructorArgs, privateData);
    return utils.implForWrapper(obj);
  },
  _internalSetup: function _internalSetup(obj) {},
  setup: function setup(obj, constructorArgs, privateData) {
    if (!privateData) privateData = {};

    privateData.wrapper = obj;

    this._internalSetup(obj);
    Object.defineProperty(obj, impl, {
      value: new Impl.implementation(constructorArgs, privateData),
      writable: false,
      enumerable: false,
      configurable: true
    });
    obj[impl][utils.wrapperSymbol] = obj;
    if (Impl.init) {
      Impl.init(obj[impl], privateData);
    }
  },

  interface: DOMException,
  expose: {
    Window: { DOMException: DOMException },
    Worker: { DOMException: DOMException }
  }
}; // iface
module.exports = iface;

var Impl = _dereq_(".//DOMException-impl.js");

},{".//DOMException-impl.js":41,"./utils.js":45,"webidl-conversions":48}],43:[function(_dereq_,module,exports){
module.exports={
  "IndexSizeError": 1,
  "DOMStringSizeError": 2,
  "HierarchyRequestError": 3,
  "WrongDocumentError": 4,
  "InvalidCharacterError": 5,
  "NoDataAllowedError": 6,
  "NoModificationAllowedError": 7,
  "NotFoundError": 8,
  "NotSupportedError": 9,
  "InUseAttributeError": 10,
  "InvalidStateError": 11,
  "SyntaxError": 12,
  "InvalidModificationError": 13,
  "NamespaceError": 14,
  "InvalidAccessError": 15,
  "ValidationError": 16,
  "TypeMismatchError": 17,
  "SecurityError": 18,
  "NetworkError": 19,
  "AbortError": 20,
  "URLMismatchError": 21,
  "QuotaExceededError": 22,
  "TimeoutError": 23,
  "InvalidNodeTypeError": 24,
  "DataCloneError": 25
}

},{}],44:[function(_dereq_,module,exports){
"use strict";

module.exports = _dereq_("./DOMException").interface;

Object.setPrototypeOf(module.exports.prototype, Error.prototype);

},{"./DOMException":42}],45:[function(_dereq_,module,exports){
"use strict";

// Returns "Type(value) is Object" in ES terminology.

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function isObject(value) {
  return (typeof value === "undefined" ? "undefined" : _typeof(value)) === "object" && value !== null || typeof value === "function";
}

function getReferenceToBytes(bufferSource) {
  // Node.js' Buffer does not allow subclassing for now, so we can get away with a prototype object check for perf.
  if (Object.getPrototypeOf(bufferSource) === Buffer.prototype) {
    return bufferSource;
  }
  if (bufferSource instanceof ArrayBuffer) {
    return Buffer.from(bufferSource);
  }
  return Buffer.from(bufferSource.buffer, bufferSource.byteOffset, bufferSource.byteLength);
}

function getCopyToBytes(bufferSource) {
  return Buffer.from(getReferenceToBytes(bufferSource));
}

function mixin(target, source) {
  var keys = Object.getOwnPropertyNames(source);
  for (var i = 0; i < keys.length; ++i) {
    if (keys[i] in target) {
      continue;
    }

    Object.defineProperty(target, keys[i], Object.getOwnPropertyDescriptor(source, keys[i]));
  }
}

var wrapperSymbol = Symbol("wrapper");
var implSymbol = Symbol("impl");
var sameObjectCaches = Symbol("SameObject caches");

function getSameObject(wrapper, prop, creator) {
  if (!wrapper[sameObjectCaches]) {
    wrapper[sameObjectCaches] = Object.create(null);
  }

  if (prop in wrapper[sameObjectCaches]) {
    return wrapper[sameObjectCaches][prop];
  }

  wrapper[sameObjectCaches][prop] = creator();
  return wrapper[sameObjectCaches][prop];
}

function wrapperForImpl(impl) {
  return impl ? impl[wrapperSymbol] : null;
}

function implForWrapper(wrapper) {
  return wrapper ? wrapper[implSymbol] : null;
}

function tryWrapperForImpl(impl) {
  var wrapper = wrapperForImpl(impl);
  return wrapper ? wrapper : impl;
}

function tryImplForWrapper(wrapper) {
  var impl = implForWrapper(wrapper);
  return impl ? impl : wrapper;
}

var iterInternalSymbol = Symbol("internal");
var IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));

module.exports = exports = {
  isObject: isObject,
  getReferenceToBytes: getReferenceToBytes,
  getCopyToBytes: getCopyToBytes,
  mixin: mixin,
  wrapperSymbol: wrapperSymbol,
  implSymbol: implSymbol,
  getSameObject: getSameObject,
  wrapperForImpl: wrapperForImpl,
  implForWrapper: implForWrapper,
  tryWrapperForImpl: tryWrapperForImpl,
  tryImplForWrapper: tryImplForWrapper,
  iterInternalSymbol: iterInternalSymbol,
  IteratorPrototype: IteratorPrototype
};

},{}],46:[function(_dereq_,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function (e, t) {
  "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e.Typeson = e.Typeson || {}, e.Typeson.presets = e.Typeson.presets || {}, e.Typeson.presets.structuredCloningThrowing = t());
}(undefined, function () {
  "use strict";
  var e = "function" == typeof Symbol && "symbol" == _typeof(Symbol.iterator) ? function (e) {
    return typeof e === "undefined" ? "undefined" : _typeof(e);
  } : function (e) {
    return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e === "undefined" ? "undefined" : _typeof(e);
  },
      t = function () {
    return function (e, t) {
      if (Array.isArray(e)) return e;if (Symbol.iterator in Object(e)) return function sliceIterator(e, t) {
        var n = [],
            r = !0,
            i = !1,
            o = void 0;try {
          for (var s, a = e[Symbol.iterator](); !(r = (s = a.next()).done) && (n.push(s.value), !t || n.length !== t); r = !0) {}
        } catch (e) {
          i = !0, o = e;
        } finally {
          try {
            !r && a.return && a.return();
          } finally {
            if (i) throw o;
          }
        }return n;
      }(e, t);throw new TypeError("Invalid attempt to destructure non-iterable instance");
    };
  }(),
      n = function n(e) {
    if (Array.isArray(e)) {
      for (var t = 0, n = Array(e.length); t < e.length; t++) {
        n[t] = e[t];
      }return n;
    }return Array.from(e);
  },
      r = Object.keys,
      i = Array.isArray,
      o = {}.toString,
      s = Object.getPrototypeOf,
      a = {}.hasOwnProperty,
      c = a.toString,
      u = ["type", "replaced", "iterateIn", "iterateUnsetNumeric"];function isThenable(e, t) {
    return Typeson.isObject(e) && "function" == typeof e.then && (!t || "function" == typeof e.catch);
  }function toStringTag(e) {
    return o.call(e).slice(8, -1);
  }function hasConstructorOf(t, n) {
    if (!t || "object" !== (void 0 === t ? "undefined" : e(t))) return !1;var r = s(t);if (!r) return !1;var i = a.call(r, "constructor") && r.constructor;return "function" != typeof i ? null === n : "function" == typeof i && null !== n && c.call(i) === c.call(n);
  }function isPlainObject(e) {
    return !(!e || "Object" !== toStringTag(e)) && (!s(e) || hasConstructorOf(e, Object));
  }function isObject(t) {
    return t && "object" === (void 0 === t ? "undefined" : e(t));
  }function Typeson(o) {
    var s = [],
        a = [],
        c = {},
        f = this.types = {},
        p = this.stringify = function (e, t, n, r) {
      r = Object.assign({}, o, r, { stringification: !0 });var s = y(e, null, r);return i(s) ? JSON.stringify(s[0], t, n) : s.then(function (e) {
        return JSON.stringify(e, t, n);
      });
    };this.stringifySync = function (e, t, n, r) {
      return p(e, t, n, Object.assign({}, { throwOnBadSyncType: !0 }, r, { sync: !0 }));
    }, this.stringifyAsync = function (e, t, n, r) {
      return p(e, t, n, Object.assign({}, { throwOnBadSyncType: !0 }, r, { sync: !1 }));
    };var l = this.parse = function (e, t, n) {
      return n = Object.assign({}, o, n, { parse: !0 }), v(JSON.parse(e, t), n);
    };this.parseSync = function (e, t, n) {
      return l(e, t, Object.assign({}, { throwOnBadSyncType: !0 }, n, { sync: !0 }));
    }, this.parseAsync = function (e, t, n) {
      return l(e, t, Object.assign({}, { throwOnBadSyncType: !0 }, n, { sync: !1 }));
    }, this.specialTypeNames = function (e, t) {
      var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};return n.returnTypeNames = !0, this.encapsulate(e, t, n);
    }, this.rootTypeName = function (e, t) {
      var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};return n.iterateNone = !0, this.encapsulate(e, t, n);
    };var y = this.encapsulate = function (f, p, l) {
      var y = (l = Object.assign({ sync: !0 }, o, l)).sync,
          v = {},
          d = [],
          h = [],
          b = [],
          g = !(l && "cyclic" in l) || l.cyclic,
          m = l.encapsulateObserver,
          T = _encapsulate("", f, g, p || {}, b);function finish(e) {
        var t = Object.values(v);if (l.iterateNone) return t.length ? t[0] : Typeson.getJSONType(e);if (t.length) {
          if (l.returnTypeNames) return [].concat(n(new Set(t)));e && isPlainObject(e) && !e.hasOwnProperty("$types") ? e.$types = v : e = { $: e, $types: { $: v } };
        } else isObject(e) && e.hasOwnProperty("$types") && (e = { $: e, $types: !0 });return !l.returnTypeNames && e;
      }return b.length ? y && l.throwOnBadSyncType ? function () {
        throw new TypeError("Sync method requested but async result obtained");
      }() : Promise.resolve(function checkPromises(e, n) {
        return Promise.all(n.map(function (e) {
          return e[1].p;
        })).then(function (r) {
          return Promise.all(r.map(function (r) {
            var i = [],
                o = n.splice(0, 1)[0],
                s = t(o, 7),
                a = s[0],
                c = s[2],
                u = s[3],
                f = s[4],
                p = s[5],
                l = s[6],
                y = _encapsulate(a, r, c, u, i, !0, l),
                v = hasConstructorOf(y, TypesonPromise);return a && v ? y.p.then(function (t) {
              return f[p] = t, checkPromises(e, i);
            }) : (a ? f[p] = y : e = v ? y.p : y, checkPromises(e, i));
          }));
        }).then(function () {
          return e;
        });
      }(T, b)).then(finish) : !y && l.throwOnBadSyncType ? function () {
        throw new TypeError("Async method requested but sync result obtained");
      }() : l.stringification && y ? [finish(T)] : y ? finish(T) : Promise.resolve(finish(T));function _adaptBuiltinStateObjectProperties(e, t, n) {
        Object.assign(e, t);var r = u.map(function (t) {
          var n = e[t];return delete e[t], n;
        });n(), u.forEach(function (t, n) {
          e[t] = r[n];
        });
      }function _encapsulate(t, n, o, a, c, u, f) {
        var p = void 0,
            y = {},
            b = void 0 === n ? "undefined" : e(n),
            g = m ? function (e) {
          var r = f || a.type || Typeson.getJSONType(n);m(Object.assign(e || y, { keypath: t, value: n, cyclic: o, stateObj: a, promisesData: c, resolvingTypesonPromise: u, awaitingTypesonPromise: hasConstructorOf(n, TypesonPromise) }, void 0 !== r ? { type: r } : {}));
        } : null;if (b in { string: 1, boolean: 1, number: 1, undefined: 1 }) return void 0 === n || "number" === b && (isNaN(n) || n === -1 / 0 || n === 1 / 0) ? (p = replace(t, n, a, c, !1, u, g)) !== n && (y = { replaced: p }) : p = n, g && g(), p;if (null === n) return g && g(), n;if (o && !a.iterateIn && !a.iterateUnsetNumeric) {
          var T = d.indexOf(n);if (!(T < 0)) return v[t] = "#", g && g({ cyclicKeypath: h[T] }), "#" + h[T];!0 === o && (d.push(n), h.push(t));
        }var O = isPlainObject(n),
            w = i(n),
            S = (O || w) && (!s.length || a.replaced) || a.iterateIn ? n : replace(t, n, a, c, O || w, null, g),
            P = void 0;if (S !== n ? (p = S, y = { replaced: S }) : w || "array" === a.iterateIn ? (P = new Array(n.length), y = { clone: P }) : O || "object" === a.iterateIn ? y = { clone: P = {} } : "" === t && hasConstructorOf(n, TypesonPromise) ? (c.push([t, n, o, a, void 0, void 0, a.type]), p = n) : p = n, g && g(), l.iterateNone) return P || p;if (!P) return p;if (a.iterateIn) {
          var j = function _loop(e) {
            var r = { ownKeys: n.hasOwnProperty(e) };_adaptBuiltinStateObjectProperties(a, r, function () {
              var r = t + (t ? "." : "") + escapeKeyPathComponent(e),
                  i = _encapsulate(r, n[e], !!o, a, c, u);hasConstructorOf(i, TypesonPromise) ? c.push([r, i, !!o, a, P, e, a.type]) : void 0 !== i && (P[e] = i);
            });
          };for (var A in n) {
            j(A);
          }g && g({ endIterateIn: !0, end: !0 });
        } else r(n).forEach(function (e) {
          var r = t + (t ? "." : "") + escapeKeyPathComponent(e);_adaptBuiltinStateObjectProperties(a, { ownKeys: !0 }, function () {
            var t = _encapsulate(r, n[e], !!o, a, c, u);hasConstructorOf(t, TypesonPromise) ? c.push([r, t, !!o, a, P, e, a.type]) : void 0 !== t && (P[e] = t);
          });
        }), g && g({ endIterateOwn: !0, end: !0 });if (a.iterateUnsetNumeric) {
          for (var C = n.length, N = function _loop2(e) {
            if (!(e in n)) {
              var r = t + (t ? "." : "") + e;_adaptBuiltinStateObjectProperties(a, { ownKeys: !1 }, function () {
                var t = _encapsulate(r, void 0, !!o, a, c, u);hasConstructorOf(t, TypesonPromise) ? c.push([r, t, !!o, a, P, e, a.type]) : void 0 !== t && (P[e] = t);
              });
            }
          }, B = 0; B < C; B++) {
            N(B);
          }g && g({ endIterateUnsetNumeric: !0, end: !0 });
        }return P;
      }function replace(e, t, n, r, i, o, u) {
        for (var f = i ? s : a, p = f.length; p--;) {
          var l = f[p];if (l.test(t, n)) {
            var d = l.type;if (c[d]) {
              var h = v[e];v[e] = h ? [d].concat(h) : d;
            }return Object.assign(n, { type: d, replaced: !0 }), !y && l.replaceAsync || l.replace ? (u && u({ replacing: !0 }), _encapsulate(e, l[y || !l.replaceAsync ? "replace" : "replaceAsync"](t, n), g && "readonly", n, r, o, d)) : (u && u({ typeDetected: !0 }), _encapsulate(e, t, g && "readonly", n, r, o, d));
          }
        }return t;
      }
    };this.encapsulateSync = function (e, t, n) {
      return y(e, t, Object.assign({}, { throwOnBadSyncType: !0 }, n, { sync: !0 }));
    }, this.encapsulateAsync = function (e, t, n) {
      return y(e, t, Object.assign({}, { throwOnBadSyncType: !0 }, n, { sync: !1 }));
    };var v = this.revive = function (e, n) {
      var s = (n = Object.assign({ sync: !0 }, o, n)).sync,
          a = e && e.$types,
          u = !0;if (!a) return e;if (!0 === a) return e.$;a.$ && isPlainObject(a.$) && (e = e.$, a = a.$, u = !1);var f = [],
          p = {},
          l = function _revive(e, n, o, s, l, y) {
        if (u && "$types" === e) return;var v = a[e];if (i(n) || isPlainObject(n)) {
          var d = i(n) ? new Array(n.length) : {};for (r(n).forEach(function (t) {
            var r = _revive(e + (e ? "." : "") + escapeKeyPathComponent(t), n[t], o || d, s, d, t);hasConstructorOf(r, Undefined) ? d[t] = void 0 : void 0 !== r && (d[t] = r);
          }), n = d; f.length;) {
            var h = t(f[0], 4),
                b = h[0],
                g = h[1],
                m = h[2],
                T = h[3],
                O = getByKeyPath(b, g);if (hasConstructorOf(O, Undefined)) m[T] = void 0;else {
              if (void 0 === O) break;m[T] = O;
            }f.splice(0, 1);
          }
        }if (!v) return n;if ("#" === v) {
          var w = getByKeyPath(o, n.substr(1));return void 0 === w && f.push([o, n.substr(1), l, y]), w;
        }var S = s.sync;return [].concat(v).reduce(function (e, t) {
          var n = c[t];if (!n) throw new Error("Unregistered type: " + t);return n[S && n.revive ? "revive" : !S && n.reviveAsync ? "reviveAsync" : "revive"](e, p);
        }, n);
      }("", e, null, n);return isThenable(l = hasConstructorOf(l, Undefined) ? void 0 : l) ? s && n.throwOnBadSyncType ? function () {
        throw new TypeError("Sync method requested but async result obtained");
      }() : l : !s && n.throwOnBadSyncType ? function () {
        throw new TypeError("Async method requested but sync result obtained");
      }() : s ? l : Promise.resolve(l);
    };this.reviveSync = function (e, t) {
      return v(e, Object.assign({}, { throwOnBadSyncType: !0 }, t, { sync: !0 }));
    }, this.reviveAsync = function (e, t) {
      return v(e, Object.assign({}, { throwOnBadSyncType: !0 }, t, { sync: !1 }));
    }, this.register = function (e, t) {
      return t = t || {}, [].concat(e).forEach(function R(e) {
        if (i(e)) return e.map(R);e && r(e).forEach(function (n) {
          if ("#" === n) throw new TypeError("# cannot be used as a type name as it is reserved for cyclic objects");if (Typeson.JSON_TYPES.includes(n)) throw new TypeError("Plain JSON object types are reserved as type names");var r = e[n],
              o = r.testPlainObjects ? s : a,
              u = o.filter(function (e) {
            return e.type === n;
          });if (u.length && (o.splice(o.indexOf(u[0]), 1), delete c[n], delete f[n]), r) {
            if ("function" == typeof r) {
              var p = r;r = { test: function test(e) {
                  return e && e.constructor === p;
                }, replace: function replace(e) {
                  return assign({}, e);
                }, revive: function revive(e) {
                  return assign(Object.create(p.prototype), e);
                } };
            } else i(r) && (r = { test: r[0], replace: r[1], revive: r[2] });var l = { type: n, test: r.test.bind(r) };r.replace && (l.replace = r.replace.bind(r)), r.replaceAsync && (l.replaceAsync = r.replaceAsync.bind(r));var y = "number" == typeof t.fallback ? t.fallback : t.fallback ? 0 : 1 / 0;if (r.testPlainObjects ? s.splice(y, 0, l) : a.splice(y, 0, l), r.revive || r.reviveAsync) {
              var v = {};r.revive && (v.revive = r.revive.bind(r)), r.reviveAsync && (v.reviveAsync = r.reviveAsync.bind(r)), c[n] = v;
            }f[n] = r;
          }
        });
      }), this;
    };
  }function assign(e, t) {
    return r(t).map(function (n) {
      e[n] = t[n];
    }), e;
  }function escapeKeyPathComponent(e) {
    return e.replace(/~/g, "~0").replace(/\./g, "~1");
  }function unescapeKeyPathComponent(e) {
    return e.replace(/~1/g, ".").replace(/~0/g, "~");
  }function getByKeyPath(e, t) {
    if ("" === t) return e;var n = t.indexOf(".");if (n > -1) {
      var r = e[unescapeKeyPathComponent(t.substr(0, n))];return void 0 === r ? void 0 : getByKeyPath(r, t.substr(n + 1));
    }return e[unescapeKeyPathComponent(t)];
  }function Undefined() {}function TypesonPromise(e) {
    this.p = new Promise(e);
  }TypesonPromise.prototype.then = function (e, t) {
    var n = this;return new TypesonPromise(function (r, i) {
      n.p.then(function (t) {
        r(e ? e(t) : t);
      }, function (e) {
        n.p.catch(function (e) {
          return t ? t(e) : Promise.reject(e);
        }).then(r, i);
      });
    });
  }, TypesonPromise.prototype.catch = function (e) {
    return this.then(null, e);
  }, TypesonPromise.resolve = function (e) {
    return new TypesonPromise(function (t) {
      t(e);
    });
  }, TypesonPromise.reject = function (e) {
    return new TypesonPromise(function (t, n) {
      n(e);
    });
  }, ["all", "race"].map(function (e) {
    TypesonPromise[e] = function (t) {
      return new TypesonPromise(function (n, r) {
        Promise[e](t.map(function (e) {
          return e.p;
        })).then(n, r);
      });
    };
  }), Typeson.Undefined = Undefined, Typeson.Promise = TypesonPromise, Typeson.isThenable = isThenable, Typeson.toStringTag = toStringTag, Typeson.hasConstructorOf = hasConstructorOf, Typeson.isObject = isObject, Typeson.isPlainObject = isPlainObject, Typeson.isUserObject = function isUserObject(e) {
    if (!e || "Object" !== toStringTag(e)) return !1;var t = s(e);return !t || hasConstructorOf(e, Object) || isUserObject(t);
  }, Typeson.escapeKeyPathComponent = escapeKeyPathComponent, Typeson.unescapeKeyPathComponent = unescapeKeyPathComponent, Typeson.getByKeyPath = getByKeyPath, Typeson.getJSONType = function (t) {
    return null === t ? "null" : i(t) ? "array" : void 0 === t ? "undefined" : e(t);
  }, Typeson.JSON_TYPES = ["null", "boolean", "number", "string", "array", "object"];for (var f = { userObject: { test: function test(e, t) {
        return Typeson.isUserObject(e);
      }, replace: function replace(e) {
        return Object.assign({}, e);
      }, revive: function revive(e) {
        return e;
      } } }, p = [[{ sparseArrays: { testPlainObjects: !0, test: function test(e) {
        return Array.isArray(e);
      }, replace: function replace(e, t) {
        return t.iterateUnsetNumeric = !0, e;
      } } }, { sparseUndefined: { test: function test(e, t) {
        return void 0 === e && !1 === t.ownKeys;
      }, replace: function replace(e) {
        return null;
      }, revive: function revive(e) {} } }], { undef: { test: function test(e, t) {
        return void 0 === e && (t.ownKeys || !("ownKeys" in t));
      }, replace: function replace(e) {
        return null;
      }, revive: function revive(e) {
        return new Typeson.Undefined();
      } } }], l = { StringObject: { test: function test(t) {
        return "String" === Typeson.toStringTag(t) && "object" === (void 0 === t ? "undefined" : e(t));
      }, replace: function replace(e) {
        return String(e);
      }, revive: function revive(e) {
        return new String(e);
      } }, BooleanObject: { test: function test(t) {
        return "Boolean" === Typeson.toStringTag(t) && "object" === (void 0 === t ? "undefined" : e(t));
      }, replace: function replace(e) {
        return Boolean(e);
      }, revive: function revive(e) {
        return new Boolean(e);
      } }, NumberObject: { test: function test(t) {
        return "Number" === Typeson.toStringTag(t) && "object" === (void 0 === t ? "undefined" : e(t));
      }, replace: function replace(e) {
        return Number(e);
      }, revive: function revive(e) {
        return new Number(e);
      } } }, y = [{ nan: { test: function test(e) {
        return "number" == typeof e && isNaN(e);
      }, replace: function replace(e) {
        return "NaN";
      }, revive: function revive(e) {
        return NaN;
      } } }, { infinity: { test: function test(e) {
        return e === 1 / 0;
      }, replace: function replace(e) {
        return "Infinity";
      }, revive: function revive(e) {
        return 1 / 0;
      } } }, { negativeInfinity: { test: function test(e) {
        return e === -1 / 0;
      }, replace: function replace(e) {
        return "-Infinity";
      }, revive: function revive(e) {
        return -1 / 0;
      } } }], v = { date: { test: function test(e) {
        return "Date" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        var t = e.getTime();return isNaN(t) ? "NaN" : t;
      }, revive: function revive(e) {
        return "NaN" === e ? new Date(NaN) : new Date(e);
      } } }, d = { regexp: { test: function test(e) {
        return "RegExp" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        return { source: e.source, flags: (e.global ? "g" : "") + (e.ignoreCase ? "i" : "") + (e.multiline ? "m" : "") + (e.sticky ? "y" : "") + (e.unicode ? "u" : "") };
      }, revive: function revive(e) {
        var t = e.source,
            n = e.flags;return new RegExp(t, n);
      } } }, h = { map: { test: function test(e) {
        return "Map" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        return Array.from(e.entries());
      }, revive: function revive(e) {
        return new Map(e);
      } } }, b = { set: { test: function test(e) {
        return "Set" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        return Array.from(e.values());
      }, revive: function revive(e) {
        return new Set(e);
      } } }, g = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", m = new Uint8Array(256), T = 0; T < g.length; T++) {
    m[g.charCodeAt(T)] = T;
  }var O = function encode(e, t, n) {
    for (var r = new Uint8Array(e, t, n), i = r.length, o = "", s = 0; s < i; s += 3) {
      o += g[r[s] >> 2], o += g[(3 & r[s]) << 4 | r[s + 1] >> 4], o += g[(15 & r[s + 1]) << 2 | r[s + 2] >> 6], o += g[63 & r[s + 2]];
    }return i % 3 == 2 ? o = o.substring(0, o.length - 1) + "=" : i % 3 == 1 && (o = o.substring(0, o.length - 2) + "=="), o;
  },
      w = function decode(e) {
    var t = e.length,
        n = .75 * e.length,
        r = 0,
        i = void 0,
        o = void 0,
        s = void 0,
        a = void 0;"=" === e[e.length - 1] && (n--, "=" === e[e.length - 2] && n--);for (var c = new ArrayBuffer(n), u = new Uint8Array(c), f = 0; f < t; f += 4) {
      i = m[e.charCodeAt(f)], o = m[e.charCodeAt(f + 1)], s = m[e.charCodeAt(f + 2)], a = m[e.charCodeAt(f + 3)], u[r++] = i << 2 | o >> 4, u[r++] = (15 & o) << 4 | s >> 2, u[r++] = (3 & s) << 6 | 63 & a;
    }return c;
  },
      S = { arraybuffer: { test: function test(e) {
        return "ArrayBuffer" === Typeson.toStringTag(e);
      }, replace: function replace(e, t) {
        t.buffers || (t.buffers = []);var n = t.buffers.indexOf(e);return n > -1 ? { index: n } : (t.buffers.push(e), O(e));
      }, revive: function revive(t, n) {
        if (n.buffers || (n.buffers = []), "object" === (void 0 === t ? "undefined" : e(t))) return n.buffers[t.index];var r = w(t);return n.buffers.push(r), r;
      } } },
      P = "undefined" == typeof self ? global : self,
      j = {};["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array"].forEach(function (e) {
    var t = e,
        n = P[t];n && (j[e.toLowerCase()] = { test: function test(e) {
        return Typeson.toStringTag(e) === t;
      }, replace: function replace(e, t) {
        var n = e.buffer,
            r = e.byteOffset,
            i = e.length;t.buffers || (t.buffers = []);var o = t.buffers.indexOf(n);return o > -1 ? { index: o, byteOffset: r, length: i } : (t.buffers.push(n), { encoded: O(n), byteOffset: r, length: i });
      }, revive: function revive(e, t) {
        t.buffers || (t.buffers = []);var r = e.byteOffset,
            i = e.length,
            o = e.encoded,
            s = e.index,
            a = void 0;return "index" in e ? a = t.buffers[s] : (a = w(o), t.buffers.push(a)), new n(a, r, i);
      } });
  });var A = { dataview: { test: function test(e) {
        return "DataView" === Typeson.toStringTag(e);
      }, replace: function replace(e, t) {
        var n = e.buffer,
            r = e.byteOffset,
            i = e.byteLength;t.buffers || (t.buffers = []);var o = t.buffers.indexOf(n);return o > -1 ? { index: o, byteOffset: r, byteLength: i } : (t.buffers.push(n), { encoded: O(n), byteOffset: r, byteLength: i });
      }, revive: function revive(e, t) {
        t.buffers || (t.buffers = []);var n = e.byteOffset,
            r = e.byteLength,
            i = e.encoded,
            o = e.index,
            s = void 0;return "index" in e ? s = t.buffers[o] : (s = w(i), t.buffers.push(s)), new DataView(s, n, r);
      } } },
      C = { IntlCollator: { test: function test(e) {
        return Typeson.hasConstructorOf(e, Intl.Collator);
      }, replace: function replace(e) {
        return e.resolvedOptions();
      }, revive: function revive(e) {
        return new Intl.Collator(e.locale, e);
      } }, IntlDateTimeFormat: { test: function test(e) {
        return Typeson.hasConstructorOf(e, Intl.DateTimeFormat);
      }, replace: function replace(e) {
        return e.resolvedOptions();
      }, revive: function revive(e) {
        return new Intl.DateTimeFormat(e.locale, e);
      } }, IntlNumberFormat: { test: function test(e) {
        return Typeson.hasConstructorOf(e, Intl.NumberFormat);
      }, replace: function replace(e) {
        return e.resolvedOptions();
      }, revive: function revive(e) {
        return new Intl.NumberFormat(e.locale, e);
      } } },
      N = { file: { test: function test(e) {
        return "File" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        var t = new XMLHttpRequest();if (t.open("GET", URL.createObjectURL(e), !1), 200 !== t.status && 0 !== t.status) throw new Error("Bad Blob access: " + t.status);return t.send(), { type: e.type, stringContents: t.responseText, name: e.name, lastModified: e.lastModified };
      }, revive: function revive(e) {
        var t = e.name,
            n = e.type,
            r = e.stringContents,
            i = e.lastModified;return new File([r], t, { type: n, lastModified: i });
      }, replaceAsync: function replaceAsync(e) {
        return new Typeson.Promise(function (t, n) {
          if (e.isClosed) n(new Error("The File is closed"));else {
            var r = new FileReader();r.addEventListener("load", function () {
              t({ type: e.type, stringContents: r.result, name: e.name, lastModified: e.lastModified });
            }), r.addEventListener("error", function () {
              n(r.error);
            }), r.readAsText(e);
          }
        });
      } } };return [f, p, l, y, v, d, { imagedata: { test: function test(e) {
        return "ImageData" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        return { array: Array.from(e.data), width: e.width, height: e.height };
      }, revive: function revive(e) {
        return new ImageData(new Uint8ClampedArray(e.array), e.width, e.height);
      } } }, { imagebitmap: { test: function test(e) {
        return "ImageBitmap" === Typeson.toStringTag(e) || e && e.dataset && "ImageBitmap" === e.dataset.toStringTag;
      }, replace: function replace(e) {
        var t = document.createElement("canvas");return t.getContext("2d").drawImage(e, 0, 0), t.toDataURL();
      }, revive: function revive(e) {
        var t = document.createElement("canvas"),
            n = t.getContext("2d"),
            r = document.createElement("img");return r.onload = function () {
          n.drawImage(r, 0, 0);
        }, r.src = e, t;
      }, reviveAsync: function reviveAsync(e) {
        var t = document.createElement("canvas"),
            n = t.getContext("2d"),
            r = document.createElement("img");return r.onload = function () {
          n.drawImage(r, 0, 0);
        }, r.src = e, createImageBitmap(t);
      } } }, N, { file: N.file, filelist: { test: function test(e) {
        return "FileList" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        for (var t = [], n = 0; n < e.length; n++) {
          t[n] = e.item(n);
        }return t;
      }, revive: function revive(e) {
        function FileList() {
          this._files = arguments[0], this.length = this._files.length;
        }return FileList.prototype.item = function (e) {
          return this._files[e];
        }, FileList.prototype[Symbol.toStringTag] = "FileList", new FileList(e);
      } } }, { blob: { test: function test(e) {
        return "Blob" === Typeson.toStringTag(e);
      }, replace: function replace(e) {
        var t = new XMLHttpRequest();if (t.open("GET", URL.createObjectURL(e), !1), 200 !== t.status && 0 !== t.status) throw new Error("Bad Blob access: " + t.status);return t.send(), { type: e.type, stringContents: t.responseText };
      }, revive: function revive(e) {
        var t = e.type,
            n = e.stringContents;return new Blob([n], { type: t });
      }, replaceAsync: function replaceAsync(e) {
        return new Typeson.Promise(function (t, n) {
          if (e.isClosed) n(new Error("The Blob is closed"));else {
            var r = new FileReader();r.addEventListener("load", function () {
              t({ type: e.type, stringContents: r.result });
            }), r.addEventListener("error", function () {
              n(r.error);
            }), r.readAsText(e);
          }
        });
      } } }].concat("function" == typeof Map ? h : [], "function" == typeof Set ? b : [], "function" == typeof ArrayBuffer ? S : [], "function" == typeof Uint8Array ? j : [], "function" == typeof DataView ? A : [], "undefined" != typeof Intl ? C : []).concat({ checkDataCloneException: [function (t) {
      var n = {}.toString.call(t).slice(8, -1);if (["symbol", "function"].includes(void 0 === t ? "undefined" : e(t)) || ["Arguments", "Module", "Error", "Promise", "WeakMap", "WeakSet"].includes(n) || t === Object.prototype || ("Blob" === n || "File" === n) && t.isClosed || t && "object" === (void 0 === t ? "undefined" : e(t)) && "number" == typeof t.nodeType && "function" == typeof t.insertBefore) throw new DOMException("The object cannot be cloned.", "DataCloneError");return !1;
    }] });
});


},{}],47:[function(_dereq_,module,exports){
"use strict";

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _typeof = "function" == typeof Symbol && "symbol" == _typeof2(Symbol.iterator) ? function (e) {
  return typeof e === "undefined" ? "undefined" : _typeof2(e);
} : function (e) {
  return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e === "undefined" ? "undefined" : _typeof2(e);
},
    slicedToArray = function () {
  return function (e, n) {
    if (Array.isArray(e)) return e;if (Symbol.iterator in Object(e)) return function sliceIterator(e, n) {
      var t = [],
          r = !0,
          i = !1,
          o = void 0;try {
        for (var s, a = e[Symbol.iterator](); !(r = (s = a.next()).done) && (t.push(s.value), !n || t.length !== n); r = !0) {}
      } catch (e) {
        i = !0, o = e;
      } finally {
        try {
          !r && a.return && a.return();
        } finally {
          if (i) throw o;
        }
      }return t;
    }(e, n);throw new TypeError("Invalid attempt to destructure non-iterable instance");
  };
}(),
    toConsumableArray = function toConsumableArray(e) {
  if (Array.isArray(e)) {
    for (var n = 0, t = Array(e.length); n < e.length; n++) {
      t[n] = e[n];
    }return t;
  }return Array.from(e);
},
    keys = Object.keys,
    isArray = Array.isArray,
    toString = {}.toString,
    getProto = Object.getPrototypeOf,
    hasOwn = {}.hasOwnProperty,
    fnToString = hasOwn.toString,
    internalStateObjPropsToIgnore = ["type", "replaced", "iterateIn", "iterateUnsetNumeric"];function isThenable(e, n) {
  return Typeson.isObject(e) && "function" == typeof e.then && (!n || "function" == typeof e.catch);
}function toStringTag(e) {
  return toString.call(e).slice(8, -1);
}function hasConstructorOf(e, n) {
  if (!e || "object" !== (void 0 === e ? "undefined" : _typeof(e))) return !1;var t = getProto(e);if (!t) return !1;var r = hasOwn.call(t, "constructor") && t.constructor;return "function" != typeof r ? null === n : "function" == typeof r && null !== n && fnToString.call(r) === fnToString.call(n);
}function isPlainObject(e) {
  return !(!e || "Object" !== toStringTag(e)) && (!getProto(e) || hasConstructorOf(e, Object));
}function isUserObject(e) {
  if (!e || "Object" !== toStringTag(e)) return !1;var n = getProto(e);return !n || hasConstructorOf(e, Object) || isUserObject(n);
}function isObject(e) {
  return e && "object" === (void 0 === e ? "undefined" : _typeof(e));
}function Typeson(e) {
  var n = [],
      t = [],
      r = {},
      i = this.types = {},
      o = this.stringify = function (n, t, r, i) {
    i = Object.assign({}, e, i, { stringification: !0 });var o = a(n, null, i);return isArray(o) ? JSON.stringify(o[0], t, r) : o.then(function (e) {
      return JSON.stringify(e, t, r);
    });
  };this.stringifySync = function (e, n, t, r) {
    return o(e, n, t, Object.assign({}, { throwOnBadSyncType: !0 }, r, { sync: !0 }));
  }, this.stringifyAsync = function (e, n, t, r) {
    return o(e, n, t, Object.assign({}, { throwOnBadSyncType: !0 }, r, { sync: !1 }));
  };var s = this.parse = function (n, t, r) {
    return r = Object.assign({}, e, r, { parse: !0 }), c(JSON.parse(n, t), r);
  };this.parseSync = function (e, n, t) {
    return s(e, n, Object.assign({}, { throwOnBadSyncType: !0 }, t, { sync: !0 }));
  }, this.parseAsync = function (e, n, t) {
    return s(e, n, Object.assign({}, { throwOnBadSyncType: !0 }, t, { sync: !1 }));
  }, this.specialTypeNames = function (e, n) {
    var t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};return t.returnTypeNames = !0, this.encapsulate(e, n, t);
  }, this.rootTypeName = function (e, n) {
    var t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};return t.iterateNone = !0, this.encapsulate(e, n, t);
  };var a = this.encapsulate = function (i, o, s) {
    var a = (s = Object.assign({ sync: !0 }, e, s)).sync,
        c = {},
        u = [],
        y = [],
        p = [],
        f = !(s && "cyclic" in s) || s.cyclic,
        l = s.encapsulateObserver,
        h = _encapsulate("", i, f, o || {}, p);function finish(e) {
      var n = Object.values(c);if (s.iterateNone) return n.length ? n[0] : Typeson.getJSONType(e);if (n.length) {
        if (s.returnTypeNames) return [].concat(toConsumableArray(new Set(n)));e && isPlainObject(e) && !e.hasOwnProperty("$types") ? e.$types = c : e = { $: e, $types: { $: c } };
      } else isObject(e) && e.hasOwnProperty("$types") && (e = { $: e, $types: !0 });return !s.returnTypeNames && e;
    }return p.length ? a && s.throwOnBadSyncType ? function () {
      throw new TypeError("Sync method requested but async result obtained");
    }() : Promise.resolve(function checkPromises(e, n) {
      return Promise.all(n.map(function (e) {
        return e[1].p;
      })).then(function (t) {
        return Promise.all(t.map(function (t) {
          var r = [],
              i = n.splice(0, 1)[0],
              o = slicedToArray(i, 7),
              s = o[0],
              a = o[2],
              c = o[3],
              u = o[4],
              y = o[5],
              p = o[6],
              f = _encapsulate(s, t, a, c, r, !0, p),
              l = hasConstructorOf(f, TypesonPromise);return s && l ? f.p.then(function (n) {
            return u[y] = n, checkPromises(e, r);
          }) : (s ? u[y] = f : e = l ? f.p : f, checkPromises(e, r));
        }));
      }).then(function () {
        return e;
      });
    }(h, p)).then(finish) : !a && s.throwOnBadSyncType ? function () {
      throw new TypeError("Async method requested but sync result obtained");
    }() : s.stringification && a ? [finish(h)] : a ? finish(h) : Promise.resolve(finish(h));function _adaptBuiltinStateObjectProperties(e, n, t) {
      Object.assign(e, n);var r = internalStateObjPropsToIgnore.map(function (n) {
        var t = e[n];return delete e[n], t;
      });t(), internalStateObjPropsToIgnore.forEach(function (n, t) {
        e[n] = r[t];
      });
    }function _encapsulate(e, t, r, i, o, a, p) {
      var f = void 0,
          h = {},
          v = void 0 === t ? "undefined" : _typeof(t),
          d = l ? function (n) {
        var s = p || i.type || Typeson.getJSONType(t);l(Object.assign(n || h, { keypath: e, value: t, cyclic: r, stateObj: i, promisesData: o, resolvingTypesonPromise: a, awaitingTypesonPromise: hasConstructorOf(t, TypesonPromise) }, void 0 !== s ? { type: s } : {}));
      } : null;if (v in { string: 1, boolean: 1, number: 1, undefined: 1 }) return void 0 === t || "number" === v && (isNaN(t) || t === -1 / 0 || t === 1 / 0) ? (f = replace(e, t, i, o, !1, a, d)) !== t && (h = { replaced: f }) : f = t, d && d(), f;if (null === t) return d && d(), t;if (r && !i.iterateIn && !i.iterateUnsetNumeric) {
        var b = u.indexOf(t);if (!(b < 0)) return c[e] = "#", d && d({ cyclicKeypath: y[b] }), "#" + y[b];!0 === r && (u.push(t), y.push(e));
      }var O = isPlainObject(t),
          g = isArray(t),
          T = (O || g) && (!n.length || i.replaced) || i.iterateIn ? t : replace(e, t, i, o, O || g, null, d),
          m = void 0;if (T !== t ? (f = T, h = { replaced: T }) : g || "array" === i.iterateIn ? (m = new Array(t.length), h = { clone: m }) : O || "object" === i.iterateIn ? h = { clone: m = {} } : "" === e && hasConstructorOf(t, TypesonPromise) ? (o.push([e, t, r, i, void 0, void 0, i.type]), f = t) : f = t, d && d(), s.iterateNone) return m || f;if (!m) return f;if (i.iterateIn) {
        var P = function _loop(n) {
          var s = { ownKeys: t.hasOwnProperty(n) };_adaptBuiltinStateObjectProperties(i, s, function () {
            var s = e + (e ? "." : "") + escapeKeyPathComponent(n),
                c = _encapsulate(s, t[n], !!r, i, o, a);hasConstructorOf(c, TypesonPromise) ? o.push([s, c, !!r, i, m, n, i.type]) : void 0 !== c && (m[n] = c);
          });
        };for (var j in t) {
          P(j);
        }d && d({ endIterateIn: !0, end: !0 });
      } else keys(t).forEach(function (n) {
        var s = e + (e ? "." : "") + escapeKeyPathComponent(n);_adaptBuiltinStateObjectProperties(i, { ownKeys: !0 }, function () {
          var e = _encapsulate(s, t[n], !!r, i, o, a);hasConstructorOf(e, TypesonPromise) ? o.push([s, e, !!r, i, m, n, i.type]) : void 0 !== e && (m[n] = e);
        });
      }), d && d({ endIterateOwn: !0, end: !0 });if (i.iterateUnsetNumeric) {
        for (var S = t.length, w = function _loop2(n) {
          if (!(n in t)) {
            var s = e + (e ? "." : "") + n;_adaptBuiltinStateObjectProperties(i, { ownKeys: !1 }, function () {
              var e = _encapsulate(s, void 0, !!r, i, o, a);hasConstructorOf(e, TypesonPromise) ? o.push([s, e, !!r, i, m, n, i.type]) : void 0 !== e && (m[n] = e);
            });
          }
        }, A = 0; A < S; A++) {
          w(A);
        }d && d({ endIterateUnsetNumeric: !0, end: !0 });
      }return m;
    }function replace(e, i, o, s, u, y, p) {
      for (var l = u ? n : t, h = l.length; h--;) {
        var v = l[h];if (v.test(i, o)) {
          var d = v.type;if (r[d]) {
            var b = c[e];c[e] = b ? [d].concat(b) : d;
          }return Object.assign(o, { type: d, replaced: !0 }), !a && v.replaceAsync || v.replace ? (p && p({ replacing: !0 }), _encapsulate(e, v[a || !v.replaceAsync ? "replace" : "replaceAsync"](i, o), f && "readonly", o, s, y, d)) : (p && p({ typeDetected: !0 }), _encapsulate(e, i, f && "readonly", o, s, y, d));
        }
      }return i;
    }
  };this.encapsulateSync = function (e, n, t) {
    return a(e, n, Object.assign({}, { throwOnBadSyncType: !0 }, t, { sync: !0 }));
  }, this.encapsulateAsync = function (e, n, t) {
    return a(e, n, Object.assign({}, { throwOnBadSyncType: !0 }, t, { sync: !1 }));
  };var c = this.revive = function (n, t) {
    var i = (t = Object.assign({ sync: !0 }, e, t)).sync,
        o = n && n.$types,
        s = !0;if (!o) return n;if (!0 === o) return n.$;o.$ && isPlainObject(o.$) && (n = n.$, o = o.$, s = !1);var a = [],
        c = {},
        u = function _revive(e, n, t, i, u, y) {
      if (s && "$types" === e) return;var p = o[e];if (isArray(n) || isPlainObject(n)) {
        var f = isArray(n) ? new Array(n.length) : {};for (keys(n).forEach(function (r) {
          var o = _revive(e + (e ? "." : "") + escapeKeyPathComponent(r), n[r], t || f, i, f, r);hasConstructorOf(o, Undefined) ? f[r] = void 0 : void 0 !== o && (f[r] = o);
        }), n = f; a.length;) {
          var l = slicedToArray(a[0], 4),
              h = l[0],
              v = l[1],
              d = l[2],
              b = l[3],
              O = getByKeyPath(h, v);if (hasConstructorOf(O, Undefined)) d[b] = void 0;else {
            if (void 0 === O) break;d[b] = O;
          }a.splice(0, 1);
        }
      }if (!p) return n;if ("#" === p) {
        var g = getByKeyPath(t, n.substr(1));return void 0 === g && a.push([t, n.substr(1), u, y]), g;
      }var T = i.sync;return [].concat(p).reduce(function (e, n) {
        var t = r[n];if (!t) throw new Error("Unregistered type: " + n);return t[T && t.revive ? "revive" : !T && t.reviveAsync ? "reviveAsync" : "revive"](e, c);
      }, n);
    }("", n, null, t);return isThenable(u = hasConstructorOf(u, Undefined) ? void 0 : u) ? i && t.throwOnBadSyncType ? function () {
      throw new TypeError("Sync method requested but async result obtained");
    }() : u : !i && t.throwOnBadSyncType ? function () {
      throw new TypeError("Async method requested but sync result obtained");
    }() : i ? u : Promise.resolve(u);
  };this.reviveSync = function (e, n) {
    return c(e, Object.assign({}, { throwOnBadSyncType: !0 }, n, { sync: !0 }));
  }, this.reviveAsync = function (e, n) {
    return c(e, Object.assign({}, { throwOnBadSyncType: !0 }, n, { sync: !1 }));
  }, this.register = function (e, o) {
    return o = o || {}, [].concat(e).forEach(function R(e) {
      if (isArray(e)) return e.map(R);e && keys(e).forEach(function (s) {
        if ("#" === s) throw new TypeError("# cannot be used as a type name as it is reserved for cyclic objects");if (Typeson.JSON_TYPES.includes(s)) throw new TypeError("Plain JSON object types are reserved as type names");var a = e[s],
            c = a.testPlainObjects ? n : t,
            u = c.filter(function (e) {
          return e.type === s;
        });if (u.length && (c.splice(c.indexOf(u[0]), 1), delete r[s], delete i[s]), a) {
          if ("function" == typeof a) {
            var y = a;a = { test: function test(e) {
                return e && e.constructor === y;
              }, replace: function replace(e) {
                return assign({}, e);
              }, revive: function revive(e) {
                return assign(Object.create(y.prototype), e);
              } };
          } else isArray(a) && (a = { test: a[0], replace: a[1], revive: a[2] });var p = { type: s, test: a.test.bind(a) };a.replace && (p.replace = a.replace.bind(a)), a.replaceAsync && (p.replaceAsync = a.replaceAsync.bind(a));var f = "number" == typeof o.fallback ? o.fallback : o.fallback ? 0 : 1 / 0;if (a.testPlainObjects ? n.splice(f, 0, p) : t.splice(f, 0, p), a.revive || a.reviveAsync) {
            var l = {};a.revive && (l.revive = a.revive.bind(a)), a.reviveAsync && (l.reviveAsync = a.reviveAsync.bind(a)), r[s] = l;
          }i[s] = a;
        }
      });
    }), this;
  };
}function assign(e, n) {
  return keys(n).map(function (t) {
    e[t] = n[t];
  }), e;
}function escapeKeyPathComponent(e) {
  return e.replace(/~/g, "~0").replace(/\./g, "~1");
}function unescapeKeyPathComponent(e) {
  return e.replace(/~1/g, ".").replace(/~0/g, "~");
}function getByKeyPath(e, n) {
  if ("" === n) return e;var t = n.indexOf(".");if (t > -1) {
    var r = e[unescapeKeyPathComponent(n.substr(0, t))];return void 0 === r ? void 0 : getByKeyPath(r, n.substr(t + 1));
  }return e[unescapeKeyPathComponent(n)];
}function Undefined() {}function TypesonPromise(e) {
  this.p = new Promise(e);
}TypesonPromise.prototype.then = function (e, n) {
  var t = this;return new TypesonPromise(function (r, i) {
    t.p.then(function (n) {
      r(e ? e(n) : n);
    }, function (e) {
      t.p.catch(function (e) {
        return n ? n(e) : Promise.reject(e);
      }).then(r, i);
    });
  });
}, TypesonPromise.prototype.catch = function (e) {
  return this.then(null, e);
}, TypesonPromise.resolve = function (e) {
  return new TypesonPromise(function (n) {
    n(e);
  });
}, TypesonPromise.reject = function (e) {
  return new TypesonPromise(function (n, t) {
    t(e);
  });
}, ["all", "race"].map(function (e) {
  TypesonPromise[e] = function (n) {
    return new TypesonPromise(function (t, r) {
      Promise[e](n.map(function (e) {
        return e.p;
      })).then(t, r);
    });
  };
}), Typeson.Undefined = Undefined, Typeson.Promise = TypesonPromise, Typeson.isThenable = isThenable, Typeson.toStringTag = toStringTag, Typeson.hasConstructorOf = hasConstructorOf, Typeson.isObject = isObject, Typeson.isPlainObject = isPlainObject, Typeson.isUserObject = isUserObject, Typeson.escapeKeyPathComponent = escapeKeyPathComponent, Typeson.unescapeKeyPathComponent = unescapeKeyPathComponent, Typeson.getByKeyPath = getByKeyPath, Typeson.getJSONType = function (e) {
  return null === e ? "null" : isArray(e) ? "array" : void 0 === e ? "undefined" : _typeof(e);
}, Typeson.JSON_TYPES = ["null", "boolean", "number", "string", "array", "object"], module.exports = Typeson;

},{}],48:[function(_dereq_,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _(message, opts) {
    return (opts && opts.context ? opts.context : "Value") + " " + message + ".";
}

function type(V) {
    if (V === null) {
        return "Null";
    }
    switch (typeof V === "undefined" ? "undefined" : _typeof(V)) {
        case "undefined":
            return "Undefined";
        case "boolean":
            return "Boolean";
        case "number":
            return "Number";
        case "string":
            return "String";
        case "symbol":
            return "Symbol";
        case "object":
        // Falls through
        case "function":
        // Falls through
        default:
            // Per ES spec, typeof returns an implemention-defined value that is not any of the existing ones for
            // uncallable non-standard exotic objects. Yet Type() which the Web IDL spec depends on returns Object for
            // such cases. So treat the default case as an object.
            return "Object";
    }
}

// Round x to the nearest integer, choosing the even integer if it lies halfway between two.
function evenRound(x) {
    // There are four cases for numbers with fractional part being .5:
    //
    // case |     x     | floor(x) | round(x) | expected | x <> 0 | x % 1 | x & 1 |   example
    //   1  |  2n + 0.5 |  2n      |  2n + 1  |  2n      |   >    |  0.5  |   0   |  0.5 ->  0
    //   2  |  2n + 1.5 |  2n + 1  |  2n + 2  |  2n + 2  |   >    |  0.5  |   1   |  1.5 ->  2
    //   3  | -2n - 0.5 | -2n - 1  | -2n      | -2n      |   <    | -0.5  |   0   | -0.5 ->  0
    //   4  | -2n - 1.5 | -2n - 2  | -2n - 1  | -2n - 2  |   <    | -0.5  |   1   | -1.5 -> -2
    // (where n is a non-negative integer)
    //
    // Branch here for cases 1 and 4
    if (x > 0 && x % 1 === +0.5 && (x & 1) === 0 || x < 0 && x % 1 === -0.5 && (x & 1) === 1) {
        return censorNegativeZero(Math.floor(x));
    }

    return censorNegativeZero(Math.round(x));
}

function integerPart(n) {
    return censorNegativeZero(Math.trunc(n));
}

function sign(x) {
    return x < 0 ? -1 : 1;
}

function modulo(x, y) {
    // https://tc39.github.io/ecma262/#eqn-modulo
    // Note that http://stackoverflow.com/a/4467559/3191 does NOT work for large modulos
    var signMightNotMatch = x % y;
    if (sign(y) !== sign(signMightNotMatch)) {
        return signMightNotMatch + y;
    }
    return signMightNotMatch;
}

function censorNegativeZero(x) {
    return x === 0 ? 0 : x;
}

function createIntegerConversion(bitLength, typeOpts) {
    var isSigned = !typeOpts.unsigned;

    var lowerBound = void 0;
    var upperBound = void 0;
    if (bitLength === 64) {
        upperBound = Math.pow(2, 53) - 1;
        lowerBound = !isSigned ? 0 : -Math.pow(2, 53) + 1;
    } else if (!isSigned) {
        lowerBound = 0;
        upperBound = Math.pow(2, bitLength) - 1;
    } else {
        lowerBound = -Math.pow(2, bitLength - 1);
        upperBound = Math.pow(2, bitLength - 1) - 1;
    }

    var twoToTheBitLength = Math.pow(2, bitLength);
    var twoToOneLessThanTheBitLength = Math.pow(2, bitLength - 1);

    return function (V, opts) {
        if (opts === undefined) {
            opts = {};
        }

        var x = +V;
        x = censorNegativeZero(x); // Spec discussion ongoing: https://github.com/heycam/webidl/issues/306

        if (opts.enforceRange) {
            if (!Number.isFinite(x)) {
                throw new TypeError(_("is not a finite number", opts));
            }

            x = integerPart(x);

            if (x < lowerBound || x > upperBound) {
                throw new TypeError(_("is outside the accepted range of " + lowerBound + " to " + upperBound + ", inclusive", opts));
            }

            return x;
        }

        if (!Number.isNaN(x) && opts.clamp) {
            x = Math.min(Math.max(x, lowerBound), upperBound);
            x = evenRound(x);
            return x;
        }

        if (!Number.isFinite(x) || x === 0) {
            return 0;
        }
        x = integerPart(x);

        // Math.pow(2, 64) is not accurately representable in JavaScript, so try to avoid these per-spec operations if
        // possible. Hopefully it's an optimization for the non-64-bitLength cases too.
        if (x >= lowerBound && x <= upperBound) {
            return x;
        }

        // These will not work great for bitLength of 64, but oh well. See the README for more details.
        x = modulo(x, twoToTheBitLength);
        if (isSigned && x >= twoToOneLessThanTheBitLength) {
            return x - twoToTheBitLength;
        }
        return x;
    };
}

exports.any = function (V) {
    return V;
};

exports.void = function () {
    return undefined;
};

exports.boolean = function (val) {
    return !!val;
};

exports.byte = createIntegerConversion(8, { unsigned: false });
exports.octet = createIntegerConversion(8, { unsigned: true });

exports.short = createIntegerConversion(16, { unsigned: false });
exports["unsigned short"] = createIntegerConversion(16, { unsigned: true });

exports.long = createIntegerConversion(32, { unsigned: false });
exports["unsigned long"] = createIntegerConversion(32, { unsigned: true });

exports["long long"] = createIntegerConversion(64, { unsigned: false });
exports["unsigned long long"] = createIntegerConversion(64, { unsigned: true });

exports.double = function (V, opts) {
    var x = +V;

    if (!Number.isFinite(x)) {
        throw new TypeError(_("is not a finite floating-point value", opts));
    }

    return x;
};

exports["unrestricted double"] = function (V) {
    var x = +V;

    return x;
};

exports.float = function (V, opts) {
    var x = +V;

    if (!Number.isFinite(x)) {
        throw new TypeError(_("is not a finite floating-point value", opts));
    }

    if (Object.is(x, -0)) {
        return x;
    }

    var y = Math.fround(x);

    if (!Number.isFinite(y)) {
        throw new TypeError(_("is outside the range of a single-precision floating-point value", opts));
    }

    return y;
};

exports["unrestricted float"] = function (V) {
    var x = +V;

    if (isNaN(x)) {
        return x;
    }

    if (Object.is(x, -0)) {
        return x;
    }

    return Math.fround(x);
};

exports.DOMString = function (V, opts) {
    if (opts === undefined) {
        opts = {};
    }

    if (opts.treatNullAsEmptyString && V === null) {
        return "";
    }

    if ((typeof V === "undefined" ? "undefined" : _typeof(V)) === "symbol") {
        throw new TypeError(_("is a symbol, which cannot be converted to a string", opts));
    }

    return String(V);
};

exports.ByteString = function (V, opts) {
    var x = exports.DOMString(V, opts);
    var c = void 0;
    for (var i = 0; (c = x.codePointAt(i)) !== undefined; ++i) {
        if (c > 255) {
            throw new TypeError(_("is not a valid ByteString", opts));
        }
    }

    return x;
};

exports.USVString = function (V, opts) {
    var S = exports.DOMString(V, opts);
    var n = S.length;
    var U = [];
    for (var i = 0; i < n; ++i) {
        var c = S.charCodeAt(i);
        if (c < 0xD800 || c > 0xDFFF) {
            U.push(String.fromCodePoint(c));
        } else if (0xDC00 <= c && c <= 0xDFFF) {
            U.push(String.fromCodePoint(0xFFFD));
        } else if (i === n - 1) {
            U.push(String.fromCodePoint(0xFFFD));
        } else {
            var d = S.charCodeAt(i + 1);
            if (0xDC00 <= d && d <= 0xDFFF) {
                var a = c & 0x3FF;
                var b = d & 0x3FF;
                U.push(String.fromCodePoint((2 << 15) + (2 << 9) * a + b));
                ++i;
            } else {
                U.push(String.fromCodePoint(0xFFFD));
            }
        }
    }

    return U.join("");
};

exports.object = function (V, opts) {
    if (type(V) !== "Object") {
        throw new TypeError(_("is not an object", opts));
    }

    return V;
};

// Not exported, but used in Function and VoidFunction.

// Neither Function nor VoidFunction is defined with [TreatNonObjectAsNull], so
// handling for that is omitted.
function convertCallbackFunction(V, opts) {
    if (typeof V !== "function") {
        throw new TypeError(_("is not a function", opts));
    }
    return V;
}

[Error, ArrayBuffer, // The IsDetachedBuffer abstract operation is not exposed in JS
DataView, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray, Float32Array, Float64Array].forEach(function (func) {
    var name = func.name;
    var article = /^[AEIOU]/.test(name) ? "an" : "a";
    exports[name] = function (V, opts) {
        if (!(V instanceof func)) {
            throw new TypeError(_("is not " + article + " " + name + " object", opts));
        }

        return V;
    };
});

// Common definitions

exports.ArrayBufferView = function (V, opts) {
    if (!ArrayBuffer.isView(V)) {
        throw new TypeError(_("is not a view on an ArrayBuffer object", opts));
    }

    return V;
};

exports.BufferSource = function (V, opts) {
    if (!(ArrayBuffer.isView(V) || V instanceof ArrayBuffer)) {
        throw new TypeError(_("is not an ArrayBuffer object or a view on one", opts));
    }

    return V;
};

exports.DOMTimeStamp = exports["unsigned long long"];

exports.Function = convertCallbackFunction;

exports.VoidFunction = convertCallbackFunction;

},{}]},{},[1])(1)
});
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":2}],37:[function(require,module,exports){
(function (process,global){(function (){
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":4}],"fake-indexeddb":[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fakeIndexedDB_1 = require("./fakeIndexedDB");
module.exports = fakeIndexedDB_1.default;

},{"./fakeIndexedDB":17}]},{},[])("fake-indexeddb")
});
