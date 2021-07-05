sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
	return {
		setDate: function (sValue) {
			var date;
			if (sValue == null || sValue == "" || sValue == undefined) {
				date = new Date();
			} else {
				if (typeof (sValue) == 'object') {
					date = sValue;
				} else {
					date = new Date();
				}

			}
			var months = ["01", "02", "03", "04", "05", "06",
				"07", "08", "09", "10", "11", "12"
			];
			var m = months[date.getMonth()];
			var d = String(date.getDate()).padStart(2, '0');
			var y = date.getFullYear();
			return d + '/' + m + '/' + y;
		},

		setStatus: function (sValue) {
			if (sValue == 'X') {
				return "GE";
			} else {
				return sValue;
			}
		},
		setState: function (sValue) {
			if (sValue == 'X') {
				return "Warning";
			} else {
				return "Success";
			}
		},
		setVisibleButtons: function (sValue, sValue1) {
			if (sValue1) {
				if (sValue == 'X') {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}

		},
		setGENO: function (sValue) {
			if (sValue == '') {
				return "-";
			} else {
				return sValue;
			}
		},
		setEditBVisible: function (sValue) {
			if (sValue == 'GE') {
				return "false";
			} else {
				return true;
			}
		},
		concatRupeeSign: function (sValue) {
			if (sValue) {
				var oCurrencyFormat = NumberFormat.getCurrencyInstance({
					currencyCode: false
				});
				return oCurrencyFormat.format(parseFloat(sValue), "INR");
			}
		}
	};
});