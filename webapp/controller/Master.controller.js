sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"com/minda/Shipments/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	"sap/ui/core/Element",
	"sap/m/MessageToast",
	"com/minda/Shipments/model/formatter",
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, Element, MessageToast, formatter) {
	"use strict";

	return Controller.extend("com.minda.Shipments.controller.Master", {
		formatter: formatter,

		onInit: function () {

			this.getOwnerComponent().setModel(new JSONModel({
				PageNumber: "1",
				material: "",
				orderId: "",
				cSelected: false,
				geSelected: false,
				sSelected: false,
				asnId: "",
				invoice: "",
				columListItemSelected: false,
				plant: "1031",
				vendor: "0000200323",
				showAdvancedSearch: false
			}), "listViewModel");
			this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;
			if (!sap.ushell) {} else {
				if (sap.ui.getCore().plants != undefined) {
					if (sap.ui.getCore().plants.hasOwnProperty("plant")) {
						if (sap.ui.getCore().plants.plant) {
							this.getOwnerComponent().getModel("listViewModel").setProperty("/plant", sap.ui.getCore().plants.plant);
							this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
						}
					}
					sap.ui.getCore().plants.registerListener(function (val) {
						if (val) {
							this.getOwnerComponent().getModel("listViewModel").setProperty("/plant", val);
							this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
						}
					}.bind(this));
				}
			}
			// this._getUserDetails();
			// this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
		},

		onListItemPress: function (oEvent) {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/columListItemSelected", false);
			oEvent.getParameter("listItem").setSelected(true);
			this.oRouter.navTo("detail", {
				asnid: oEvent.getParameter("listItem").getBindingContext("shipments").getObject().AsnId
			});
		},
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("InvoiceNo", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
		},

		onSort: function (oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId("table"),
				oBinding = oTable.getBinding("items"),
				oSorter = new Sorter("InvoiceNo", this._bDescendingSort);
			oBinding.sort(oSorter);
		},
		onAllInvoicePress: function () {
			for (var i = 0; i < this.byId("table").getItems().length; i++) {
				this.byId("table").getItems()[i].setSelected(false);
			}
			this.getOwnerComponent().getModel("listViewModel").setProperty("/columListItemSelected", true);
			this.oRouter.navTo("detail", {
				asnid: "all"
			});
		},
		onUpdateFinished: function (oEvent) {
			debugger;
			var oParams = oEvent.getParameters();
			if (oParams.reason !== "Growing") {
				if (oEvent.getSource().getItems()[0] == undefined) {
					this.oRouter.navTo("404");
				} else {
					if (!this.getOwnerComponent().getModel("device").getProperty("/system/phone")) {
						oEvent.getSource().getItems()[0].setSelected(true);
						this.oRouter.navTo("detail", {
							asnid: oEvent.getSource().getItems()[0].getBindingContext("shipments").getObject().AsnId
						});
					}

				}
				return;
			}
			var PageNumber = (parseInt(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber")) + 1) + "";
			this.getOwnerComponent().getModel("listViewModel").setProperty("/PageNumber", PageNumber);
			this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));

		},
		_applyFilter: function (oFilter) {
			var oTable = this.byId("table");
			oTable.getBinding("items").filter(oFilter);
		},

		handleFacetFilterReset: function (oEvent) {
			var oFacetFilter = Element.registry.get(oEvent.getParameter("id")),
				aFacetFilterLists = oFacetFilter.getLists();

			for (var i = 0; i < aFacetFilterLists.length; i++) {
				aFacetFilterLists[i].setSelectedKeys();
			}

			this._applyFilter([]);
		},

		handleListClose: function (oEvent) {
			var oFacetFilter = oEvent.getSource().getParent();
			this._filterModel(oFacetFilter);
		},

		handleConfirm: function (oEvent) {
			var oFacetFilter = oEvent.getSource();
			this._filterModel(oFacetFilter);
			MessageToast.show("confirm event fired");
		},

		_filterModel: function (oFacetFilter) {
			var mFacetFilterLists = oFacetFilter.getLists().filter(function (oList) {
				return oList.getSelectedItems().length;
			});

			if (mFacetFilterLists.length) {
				var oFilter = new Filter(mFacetFilterLists.map(function (oList) {
					return new Filter(oList.getSelectedItems().map(function (oItem) {
						return new Filter(oList.getKey(), "EQ", oItem.getText());
					}), false);
				}), true);
				this._applyFilter(oFilter);
			} else {
				this._applyFilter([]);
			}
		},
		onPressAdvancedSearch: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("com.minda.Shipments.fragments.AdvancedSearch", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.open();
		},
		onPressApply: function () {
			this._oDialog.close();
			if (this.getOwnerComponent().getModel("listViewModel").getProperty("/showAdvancedSearch")) {
				this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
			} else {
				var filter = [];
				if (this.getOwnerComponent().getModel("listViewModel").getProperty("/material") != "") {
					filter.push(new Filter("MaterialName", FilterOperator.Contains, this.getOwnerComponent().getModel("listViewModel").getProperty(
						"/material")));
				}
				if (this.getOwnerComponent().getModel("listViewModel").getProperty("/orderId") != "") {
					filter.push(new Filter("AgreementId", FilterOperator.Contains, this.getOwnerComponent().getModel("listViewModel").getProperty(
						"/orderId")));
				}
				if (this.getOwnerComponent().getModel("listViewModel").getProperty("/asnId") != "") {
					filter.push(new Filter("AsnId", FilterOperator.Contains, this.getOwnerComponent().getModel("listViewModel").getProperty("/asnId")));
				}
				if (this.getOwnerComponent().getModel("listViewModel").getProperty("/invoice") != "") {
					filter.push(new Filter("InvoiceNo", FilterOperator.Contains, this.getOwnerComponent().getModel("listViewModel").getProperty(
						"/invoice")));
				}
				if (this.getOwnerComponent().getModel("listViewModel").getProperty("/cSelected")) {
					filter.push(new Filter("Status", FilterOperator.EQ, "Created"));
				}
				if (this.getOwnerComponent().getModel("listViewModel").getProperty("/geSelected")) {
					filter.push(new Filter("Status", FilterOperator.EQ, "X"));
				}
				if (this.getOwnerComponent().getModel("listViewModel").getProperty("/sSelected")) {
					filter.push(new Filter("Status", FilterOperator.EQ, "Shipped"));
				}
				this.getView().byId("table").getBinding("items").filter(filter, "Application");
			}

		},
		onPressCloseDialog: function () {
			this._oDialog.close();
		},
		onPressReset: function () {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/material", "");
			this.getOwnerComponent().getModel("listViewModel").setProperty("/orderId", "");
			this.getOwnerComponent().getModel("listViewModel").setProperty("/asnId", "");
			this.getOwnerComponent().getModel("listViewModel").setProperty("/invoice", "");
			this.getOwnerComponent().getModel("listViewModel").setProperty("/cSelected", true);
			this.getOwnerComponent().getModel("listViewModel").setProperty("/geSelected", false);
			this.getOwnerComponent().getModel("listViewModel").setProperty("/sSelected", false);
			this.getView().byId("table").getBinding("items").filter([], "Application");
		},
		onChangePlant: function (oEvent) {
			debugger;
			this.getOwnerComponent().getModel("listViewModel").setProperty("/plant", oEvent.getSource().getSelectedItem().getKey());
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/plant/vendors?plantId=" + oEvent.getSource().getSelectedItem().getKey(),
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					this.plants = data.plants;
					this.getOwnerComponent().setModel(new JSONModel(data), "vendorModel");
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		onChangeVendor: function (oEvent) {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/vendor", oEvent.getSource().getSelectedItem().getKey());
		},
		onAdvancedSearchPress: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("com.minda.Schedules.fragments.AdvancedSearch", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.open();
		}
	});

});