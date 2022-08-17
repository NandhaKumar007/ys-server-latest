module.exports = {
    orderNumber() {
        let months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];;
        let date = new Date();
        return Math.floor(100000+Math.random()*999999)+"-"+months[date.getMonth()]+date.getFullYear().toString().substr(-2);
    },
    invoiceNumber(invoiceConfig) {
        let invoiceNum = "";
        let numConvert = String(invoiceConfig.next_invoice_no).padStart(invoiceConfig.min_digit, '0');
        invoiceNum = invoiceConfig.prefix+numConvert+invoiceConfig.suffix;
        return invoiceNum;
    },
    priceFormat(currency_details, price) {
        return currency_details.html_code+(price/currency_details.country_inr_value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    priceConvert(currency_details, price) {
        return (price/currency_details.country_inr_value).toFixed(2);
    },
    giftCouponCode(length) {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    },
    randomString(length) {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    },
    urlFormat(string) {
        string = string.toLowerCase().replace(/[^a-zA-Z0-9- ]/g, "");
        string = string.replace(/ +(?= )/g, "");
        string = string.replace(/[^a-zA-Z0-9]/g, "-");
        string = string.replace("---", "-");
        return string;
    },
    CALC_AC(currencyDetails, price) {
        if(!price) { price = 0; }
        let additonalCost = 0;
        if(currencyDetails.additional_charges > 0) {
            let percentage = currencyDetails.additional_charges/100;
            additonalCost = price*percentage;
        }
        let totalPrice = parseFloat(price)+parseFloat(additonalCost);
        return parseFloat((totalPrice).toFixed(2));
    },
    stringCapitalize(string) {
        if(string) {
            let array = [];
            string.split(" ").map((obj) => {
                if(obj) { array.push(obj[0].toUpperCase() + obj.substring(1).toLowerCase()); }
            });
            return array.join(" ");
        }
        else { return ""; }
    },
    rgbToHex(colors) {
        let hexCode = "#";
        colors.map(x => {
            let hex = x.toString(16);
            if(hex.length === 1) { hexCode += '0'; }
            hexCode += hex;
        });
        return hexCode;
    },
    dateDiff(date1, date2) {
        let diffDays = 0;
        date1 = new Date(new Date(date1).setHours(0,0,0,0));
        date2 = new Date(new Date(date2).setHours(23,59,59,59));
        if(date2 > date1) {
            let diffTime = Math.abs(date2 - date1);
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return diffDays;
    },
    rupeesFormat(amount) {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    lightOrDark(color) {
        let r, g, b, hsp;
        // Check the format of the color, HEX or RGB?
        if (color.match(/^rgb/)) {
          // If HEX --> store the red, green, blue values in separate variables
          color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
          r = color[1];
          g = color[2];
          b = color[3];
        } 
        else {
          // If RGB --> Convert it to HEX: http://gist.github.com/983661
          color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));
          r = color >> 16;
          g = color >> 8 & 255;
          b = color & 255;
        }
        // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
        hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
        // Using the HSP value, determine whether the color is light or dark
        if(hsp>145) return 'light'; // 127.5
        else return 'dark';
    }
};