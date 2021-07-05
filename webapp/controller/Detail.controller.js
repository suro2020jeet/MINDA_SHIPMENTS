sap.ui.define([
	"com/minda/Shipments/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/export/Spreadsheet",
	"sap/m/MessageToast",
	"com/minda/Shipments/model/formatter",
	"sap/ui/core/format/NumberFormat"
], function (Controller, JSONModel, Filter, FilterOperator, Spreadsheet, MessageToast, formatter, NumberFormat) {
	"use strict";

	return Controller.extend("com.minda.Shipments.controller.Detail", {
		formatter: formatter,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);

		},
		// handleFullScreen: function () {
		// 	this.getView().getModel("detailViewModel").setProperty("/fullScreenButtonVisible", false);
		// 	this.getView().getModel("detailViewModel").setProperty("/exitFSButtonVisible", true);
		// 	this.getOwnerComponent().getModel("layout").setProperty("/layout", "MidColumnFullScreen");
		// },
		// exitFullScreen: function () {
		// 	this.getView().getModel("detailViewModel").setProperty("/exitFSButtonVisible", false);
		// 	this.getView().getModel("detailViewModel").setProperty("/fullScreenButtonVisible", true);
		// 	this.getOwnerComponent().getModel("layout").setProperty("/layout", "TwoColumnsMidExpanded");
		// },
		handleClose: function () {
			// this.getView().getModel("detailViewModel").setProperty("/exitFSButtonVisible", false);
			// this.getView().getModel("detailViewModel").setProperty("/fullScreenButtonVisible", true);
			// this.getOwnerComponent().getModel("layout").setProperty("/layout", "OneColumn");
			this.oRouter.navTo("master");
		},
		_onProductMatched: function (oEvent) {
			var oCurrencyFormat = NumberFormat.getCurrencyInstance({
				currencyCode: false
			});
			this._product = oEvent.getParameter("arguments").asnid || this._product || "0";
			this.getView().setModel(new JSONModel({
				fullScreenButtonVisible: true,
				exitFSButtonVisible: false,
				VendorCode: "0000200323",
				Plant: "MIL - LIGHTING SONEPAT(1031)",
				felxBoxVisible: true,
				allButtonsVisible: true,
				exportButtonVisible: false,
				allInvoiceTableVisible: false,
				singleInvoiceTableVisible: true,
				otherValues: oCurrencyFormat.format(0, "INR"),
				subTotal: oCurrencyFormat.format(0, "INR"),
				details: {
					Status: 'X'
				}
			}), "detailViewModel");
			this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", true);
			if (this._product == "all") {
				var oData = {
					"Selected": "All",
					"items": [{
						"Id": "All",
						"Name": "All"
					}, {
						"Id": "Created",
						"Name": "Created"
					}, {
						"Id": "GE",
						"Name": "GE"
					}, {
						"Id": "Shipped",
						"Name": "Shipped"
					}]

				};
				this.getView().setModel(new JSONModel(oData), "comboBoxModel");
				this.getView().getModel("detailViewModel").setProperty("/exportButtonVisible", true);
				this.getView().getModel("detailViewModel").setProperty("/allButtonsVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/felxBoxVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/allInvoiceTableVisible", true);
				this.getView().getModel("detailViewModel").setProperty("/singleInvoiceTableVisible", false);
				this._getDetailViewDataforAllOrders();
			} else {
				this.getView().getModel("detailViewModel").setProperty("/exportButtonVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/allButtonsVisible", true);
				this.getView().getModel("detailViewModel").setProperty("/felxBoxVisible", true);
				this.getView().getModel("detailViewModel").setProperty("/allInvoiceTableVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/singleInvoiceTableVisible", true);
				this._getDetailViewData(this._product);
			}

		},
		_getDetailViewDataforAllOrders: function () {
			this.getView().getModel("detailViewModel").setProperty("/detailViewTitle", "All Orders");
			this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", false);
			if (this.getOwnerComponent().getModel("shipments")) {
				this.getView().getModel("detailViewModel").setProperty("/allOrderItems", this.getOwnerComponent().getModel("shipments").getData().results[
					0].Header.results[0].Item.results);

				this.getView().getModel("detailViewModel").setProperty("/invoiceTableDataTitle", "Invoices (" + this.getOwnerComponent().getModel(
					"shipments").getData().results[0].Header.results[0].Item.results.length + ")");
			}

		},
		_getDetailViewData: function (asnid) {
			var filter = [];
			filter.push(new sap.ui.model.Filter("VendorId", sap.ui.model.FilterOperator.EQ, this.getOwnerComponent().getModel("listViewModel").getProperty(
				"/VendorId")));
			filter.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, "1031"));
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel().read("/SummarySet('" + asnid + "')", {
					urlParameters: {
						"$expand": 'Header,Header/Item'
					},
					filters: filter,
					success: function (oData) {
						this.getView().getModel("detailViewModel").setProperty("/detailViewTitle", "Invoice No: " + oData.Header.results[0].InvoiceNo);
						this.getView().getModel("detailViewModel").setProperty("/details", oData.Header.results[0]);
						this.getView().getModel("detailViewModel").setProperty("/subTotal", parseFloat(oData.Header.results[0].TotalAmount) -
							parseFloat(oData.Header.results[0].IgstAmnt));
						this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", false);
						this.getView().getModel("detailViewModel").setProperty("/invoiceTableDataTitle", "Invoices (" + oData.Header.results[
							0].Item.results.length + ")");
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				});

			}.bind(this));
		},
		onPressApply: function () {
			this._oDialog.close();
			this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", true);
			var payload = {
				Header: [{
					AsnDetailsId: this.getView().getModel("detailViewModel").getProperty("/details/AsnDetailsId"),
					AsnId: this.getView().getModel("detailViewModel").getProperty("/details/AsnId"),
					DriverContactNumber: this.getView().getModel("detailViewModel").getProperty("/details/DriverContactNumber"),
					DriverName: this.getView().getModel("detailViewModel").getProperty("/details/DriverName"),
					InvoiceDate: this.getView().getModel("detailViewModel").getProperty("/details/InvoiceDate"),
					InvoiceNo: this.getView().getModel("detailViewModel").getProperty("/details/InvoiceNo"),
					Status: this.getView().getModel("detailViewModel").getProperty("/details/Status"),
					TrackingNo: this.getView().getModel("detailViewModel").getProperty("/details/TrackingNo"),
					TransporterName: this.getView().getModel("detailViewModel").getProperty("/details/TransporterName"),
					VehicleName: this.getView().getModel("detailViewModel").getProperty("/details/VehicleName"),
					VehicleNo: this.getView().getModel("detailViewModel").getProperty("/details/VehicleNo")
				}]
			};
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel().create("/SummarySet", payload, {
					success: function (oData) {
						this.getOwnerComponent().getModel("listViewModel").setProperty("/PageNumber", "1");
						this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				});

			}.bind(this));
		},
		onPressMarkShip: function () {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", true);
			var payload = {
				Header: [{
					AsnDetailsId: this.getView().getModel("detailViewModel").getProperty("/details/AsnDetailsId"),
					AsnId: this.getView().getModel("detailViewModel").getProperty("/details/AsnId"),
					DriverContactNumber: this.getView().getModel("detailViewModel").getProperty("/details/DriverContactNumber"),
					DriverName: this.getView().getModel("detailViewModel").getProperty("/details/DriverName"),
					InvoiceDate: this.getView().getModel("detailViewModel").getProperty("/details/InvoiceDate"),
					InvoiceNo: this.getView().getModel("detailViewModel").getProperty("/details/InvoiceNo"),
					Status: "Shipped",
					TrackingNo: this.getView().getModel("detailViewModel").getProperty("/details/TrackingNo"),
					TransporterName: this.getView().getModel("detailViewModel").getProperty("/details/TransporterName"),
					VehicleName: this.getView().getModel("detailViewModel").getProperty("/details/VehicleName"),
					VehicleNo: this.getView().getModel("detailViewModel").getProperty("/details/VehicleNo")
				}]
			};
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel().create("/SummarySet", payload, {
					success: function (oData) {
						this.getOwnerComponent().getModel("listViewModel").setProperty("/PageNumber", "1");
						this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				});

			}.bind(this));
		},
		onPressDeleteAsn: function () {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", true);
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel().remove("/SummarySet('" + this.getView().getModel("detailViewModel").getProperty(
					"/details/AsnId") + "')", {
					success: function (oData) {
						this.getOwnerComponent().getModel("listViewModel").setProperty("/PageNumber", "1");
						this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				});

			}.bind(this));
		},
		onMaterialCodeSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("Material", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
			if (this.getView().byId("table").getBinding("items").getLength() == 0) {
				this.getView().getModel("detailViewModel").setProperty("/subTotalVisible", false);
			} else {
				this.getView().getModel("detailViewModel").setProperty("/subTotalVisible", true);
			}
		},
		onMaterialNameSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialName", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
			if (this.getView().byId("table").getBinding("items").getLength() == 0) {
				this.getView().getModel("detailViewModel").setProperty("/subTotalVisible", false);
			} else {
				this.getView().getModel("detailViewModel").setProperty("/subTotalVisible", true);
			}
		},
		onAsnIdSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("AsnId", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table1").getBinding("items").filter(oTableSearchState, "Application");
		},
		onMaterialCodeOnAllOrederSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialName", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table1").getBinding("items").filter(oTableSearchState, "Application");
		},
		onMaterialNameOnAllOrederSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialName", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table1").getBinding("items").filter(oTableSearchState, "Application");
		},
		onInvoiceNoSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialName", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table1").getBinding("items").filter(oTableSearchState, "Application");
		},
		onChangeStatus: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("Status", FilterOperator.Contains, oEvent.getSource().getSelectedKey())];
			}
			this.getView().byId("table1").getBinding("items").filter(oTableSearchState, "Application");
		},
		onPressEdit: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("com.minda.Shipments.fragments.EditInvoice", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.open();
		},
		onPressCloseDialog: function () {
			this._oDialog.close();
		},
		onPressPrintASN: function () {
			sap.m.URLHelper.redirect("/token/download/ASN-" + this.getView().getModel("detailViewModel").getProperty("/details/AsnId"), true);
		},
		onPressPrintBinBag: function () {
			sap.m.URLHelper.redirect("/token/download/BinTag-" + this.getView().getModel("detailViewModel").getProperty("/details/AsnId"), true);
		},
		onPressRefresh: function () {
			var payload = {
				AsnId: this.getView().getModel("detailViewModel").getProperty("/details/AsnId"),
				GeNo: "",
				GrNo: "",
				Header: []
			};
			payload.Header.push(this.getView().getModel("detailViewModel").getProperty("/details"));
			payload.Header[0].Item = this.getView().getModel("detailViewModel").getProperty("/details").Item.results;
			jQuery.ajax({
				dataType: 'json',
				type: 'post',
				contentType: 'application/json',
				data: JSON.stringify(payload),
				processData: false,
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/asn/create/pdf",
				success: function (data, textStatus, jqXHR) {
					// this.userrole = data.result.roles[0].name;
					MessageToast.show("PDF generated successfully!");
				}.bind(this),
				error: function (data) {
					console.log("error", data);
				}
			});
		},
		onPressDownload: function () {
			var aColm = [{
				label: "MATERIAL CODE",
				property: "MaterialCode",
				type: "string"
			}, {
				label: "MATERIAL NAME",
				property: "MaterialName",
				type: "string"
			}, {
				label: "INVOICE NO",
				property: "",
				type: "string"
			}, {
				label: "ORDER ID",
				property: "AgreementId",
				type: "string"
			}, {
				label: "ASN ID",
				property: "AsnId",
				type: "string"
			}, {
				label: "GE NO.",
				property: "",
				type: "string"
			}, {
				label: "SCHEDULED DELIVERY DATE",
				property: "DeliveryDate",
				type: sap.ui.export.EdmType.Date,
				inputFormat: "yyyymmdd"
			}, {
				label: "SHIPPING QTY.",
				property: "Quantity",
				type: "string"
			}, {
				label: "STATUS",
				property: "",
				type: "string"
			}, {
				label: "TRANSPORTER NAME",
				property: "",
				type: "string"
			}, {
				label: "AWB NUMBER",
				property: "",
				type: "string"
			}, {
				label: "DRIVER NAME",
				property: "",
				type: "string"
			}, {
				label: "DRIVER PHONE",
				property: "",
				type: "string"
			}, {
				label: "PLANT NAME",
				property: "",
				type: "string"
			}, {
				label: "DRIVER NAME",
				property: "",
				type: "string"
			}, {
				label: "VENDOR NAME",
				property: "",
				type: "string"
			}];

			var dataResults = "";

			var oSettings = {
				workbook: {
					columns: aColm,
					hierarchyLevel: 'Level'
				},
				fileName: "Shipments",
				dataSource: this.getView().getModel("detailViewModel").getData().items

			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Spreadsheet export has finished');
				})
				.finally(function () {
					oSheet.cancel();
				});
		}
	});

});