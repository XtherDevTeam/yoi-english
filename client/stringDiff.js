function StringBuffer() {
    this.__strings__ = [];
};
StringBuffer.prototype.append = function (str) {
    this.__strings__.push(str);
    return this;
};
//格式化字符串
StringBuffer.prototype.appendFormat = function (str) {
    for (var i = 1; i < arguments.length; i++) {
        var parent = "\\{" + (i - 1) + "\\}";
        var reg = new RegExp(parent, "g")
        str = str.replace(reg, arguments[i]);
    }

    this.__strings__.push(str);
    return this;
}
StringBuffer.prototype.toString = function () {
    return this.__strings__.join('');
};
StringBuffer.prototype.clear = function () {
    this.__strings__ = [];
}
StringBuffer.prototype.size = function () {
    return this.__strings__.length;
}

var flag = 1;

function getHighLightDifferent(a, b) {
    var temp = getDiffArray(a, b);
    var a1 = getHighLight(a, temp[0]);

    var a2 = getHighLight(b, temp[1]);
    return new Array(a1, a2);
}

function getHighLight(source, temp) {
    var result = [];
    var sourceChars = source.split("");
    var tempChars = temp.split("");
    var currentValue = "";
    var currentIsDifferent = null;

    for (var i = 0; i < sourceChars.length; i++) {
        var isDiff = tempChars[i] !== ' ';

        if (currentIsDifferent === null) {
            currentIsDifferent = isDiff;
            currentValue += sourceChars[i];
        } else if (currentIsDifferent === isDiff) {
            currentValue += sourceChars[i];
        } else {
            result.push({ isDifferent: currentIsDifferent, value: currentValue });
            currentIsDifferent = isDiff;
            currentValue = sourceChars[i];
        }
    }

    if (currentValue !== "") {
        result.push({ isDifferent: currentIsDifferent, value: currentValue });
    }

    return result;
}

function getDiffArray(a, b) {
    var result = new Array();
    //选取长度较小的字符串用来穷举子串
    if (a.length < b.length) {
        var start = 0;
        var end = a.length;
        result = getDiff(a, b, start, end);
    } else {
        var start = 0;
        var end = b.length;
        result = getDiff(b, a, 0, b.length);
        result = new Array(result[1], result[0]);
    }
    return result;

}

function getDiff(a, b, start, end) {
    var result = new Array(a, b);
    var len = result[0].length;
    while (len > 0) {
        for (var i = start; i < end - len + 1; i++) {
            var sub = result[0].substring(i, i + len);
            var idx = -1;
            if ((idx = result[1].indexOf(sub)) != -1) {
                result[0] = setEmpty(result[0], i, i + len);
                result[1] = setEmpty(result[1], idx, idx + len);
                if (i > 0) {
                    result = getDiff(result[0], result[1], start, i);
                }
                if (i + len < end) {
                    result = getDiff(result[0], result[1], i + len, end);
                }
                len = 0;
                break;
            }
        }
        len = parseInt(len / 2);
    }
    return result;
}

function setEmpty(s, start, end) {
    var array = s.split("");
    for (var i = start; i < end; i++) {
        array[i] = ' ';
    }
    return array.join("");
}

export default {
    getHighLightDifferent,
    getHighLight,
}