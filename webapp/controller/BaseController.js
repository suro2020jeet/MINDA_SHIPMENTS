sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller"
], function (JSONModel, Controller) {
	"use strict";

	return Controller.extend("com.minda.Shipments.controller.BaseController", {
		onInit: function () {},
		_getMasterListData: function (PageNumber) {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", true);
			var filter = [];
			filter.push(new sap.ui.model.Filter("VendorId", sap.ui.model.FilterOperator.EQ, this.getOwnerComponent().getModel("listViewModel").getProperty(
				"/VendorId")));
			filter.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, "1031"));
			filter.push(new sap.ui.model.Filter("PageNumber", sap.ui.model.FilterOperator.EQ, PageNumber));
			filter.push(new sap.ui.model.Filter("PageSize", sap.ui.model.FilterOperator.EQ, "20"));
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel().read("/SummarySet", {
					urlParameters: {
						"$expand": 'Header,Header/Item'
					},
					filters: filter,
					success: function (oData) {
						for (var i = 0; i < oData.results.length; i++) {
							oData.results[i].InvoiceNo = oData.results[i].Header.results[0].InvoiceNo;
							oData.results[i].InvoiceDate = oData.results[i].Header.results[0].InvoiceDate;
							oData.results[i].AgreementId = oData.results[i].Header.results[0].Item.results[0].AgreementId;
							oData.results[i].MaterialName = oData.results[i].Header.results[0].Item.results[0].MaterialName;
							oData.results[i].Material = oData.results[i].Header.results[0].Item.results[0].Material;
							oData.results[i].Status = oData.results[i].Header.results[0].Status;
						}
						this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", false);
						if (this.getOwnerComponent().getModel("shipments")) {
							var aJSON = JSON.parse(this.getOwnerComponent().getModel("shipments").getJSON());
							oData.results.map(function (dat) {
								aJSON.results.push(dat);
							});
							this.getOwnerComponent().getModel("shipments").setData(aJSON);
							this.getOwnerComponent().getModel("listViewModel").setProperty("/masterViewTitle", "Invoices (" + aJSON.results.length +
								")");
						} else {
							this.getOwnerComponent().getModel("listViewModel").setProperty("/masterViewTitle", "Invoices (" + oData.results.length +
								")");
							this.getOwnerComponent().setModel(new JSONModel(oData), "shipments");
						}

					}.bind(this),
					error: function (oError) {
						this.getOwnerComponent().getModel("listViewModel").setProperty("/busy", false);
					}.bind(this)
				});

			}.bind(this));
		},
		_getAllPlants: function (vendorid) {
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/vendor/plants?vendorId=" + vendorid,
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					this.plants = data.plants;
					// this.currPlant = this.plants.find(x => x.id === this.plant).name;
					var plantModel = new JSONModel(data);
					this.getOwnerComponent().setModel(plantModel, "plantModel");
					this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		_getVendorName: function (role, user) {
			if (role === "Vendor") {
				jQuery.ajax({
					type: "GET",
					contentType: "application/x-www-form-urlencoded",
					headers: {
						"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
					},
					url: "/token/accounts/c70391893/users/groups?userId=" + user,
					async: false,
					success: function (data, textStatus, jqXHR) {
						var vendorid = data.groups[0].name;
						// data = JSON.stringify(data);
						this.getOwnerComponent().getModel("listViewModel").setProperty("/VendorId", vendorid);
						this._getAllPlants(vendorid);
					}.bind(this),
					error: function (data) {
						// console.log("error", data);
					}
				});

			}
		},
		_getCurrentUserRole: function (user) {
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/users/roles?userId=" + user,

				async: false,
				success: function (data, textStatus, jqXHR) {
					var role = data.result.roles[0].name;
					this._getVendorName(role, user);
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		_getUserDetails: function () {
			jQuery.ajax({
				type: "GET",
				contentType: "application/json",
				url: "/services/userapi/currentUser",
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					//debugger;
					var user = data.name,
						name = data.firstName;
					user = "Delhi@shankarmoulding.com";
					this._getCurrentUserRole(user);
				}.bind(this)
			});

		}
	});
});