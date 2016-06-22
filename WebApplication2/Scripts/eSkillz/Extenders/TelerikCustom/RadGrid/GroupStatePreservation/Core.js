/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var eSkillz;
(function (eSkillz) {
    var Extenders;
    (function (Extenders) {
        var TelerikCustom;
        (function (TelerikCustom) {
            var RadGrid;
            (function (RadGrid) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    (function (RefreshModes) {
                        RefreshModes[RefreshModes["ClientDataSource"] = 1] = "ClientDataSource";
                        RefreshModes[RefreshModes["AJAX"] = 2] = "AJAX";
                    })(GroupStatePreservation.RefreshModes || (GroupStatePreservation.RefreshModes = {}));
                    var RefreshModes = GroupStatePreservation.RefreshModes;
                    var Options = (function (_super) {
                        __extends(Options, _super);
                        function Options(gridClientId, RefreshMode, addEventHandlers, saveGridScrollPosition, gridContainerSelector) {
                            if (RefreshMode === void 0) { RefreshMode = null; }
                            if (addEventHandlers === void 0) { addEventHandlers = true; }
                            if (saveGridScrollPosition === void 0) { saveGridScrollPosition = false; }
                            if (gridContainerSelector === void 0) { gridContainerSelector = null; }
                            _super.call(this, gridClientId, addEventHandlers, saveGridScrollPosition, gridContainerSelector);
                            this.RefreshMode = RefreshMode;
                        }
                        return Options;
                    }(TelerikCustom.GridCommon.GroupStatePreservation.GridOptionsCommon));
                    GroupStatePreservation.Options = Options;
                    var Core = (function () {
                        function Core(options) {
                            this.options = options;
                            this._Initialize();
                        }
                        Core.prototype.get_Options = function () {
                            return this.options;
                        };
                        Core.prototype._Initialize = function () {
                            var _this = this;
                            if (!this.options.RefreshMode) {
                                if (console && typeof console.log === "function") {
                                    console.log("Error, must specify Options.RefreshMode.");
                                }
                                return;
                            }
                            this.groupStateCommon =
                                new TelerikCustom.GridCommon.GroupStatePreservation.Core(new TelerikCustom.GridCommon.GroupStatePreservation.Setup(this.options, function () {
                                    return _this._get_$MasterTableViewElement();
                                }, "tr.rgGroupHeader", "td button", ":last", "td", ":last", "rgExpand", "rgCollapse", function ($groupHeaderElement) {
                                    switch (_this.options.RefreshMode) {
                                        case RefreshModes.ClientDataSource:
                                            var grid = _this.get_Grid(), masterTableView = (grid.get_masterTableView()), kendoDataSourceWidget = $find(grid._clientDataSourceID).get_kendoWidget();
                                            var groupLevel = $groupHeaderElement.children(".rgGroupCol").length, groups = kendoDataSourceWidget.group(), fieldName = groups[groupLevel - 1].field;
                                            var nextDataRow = $groupHeaderElement.nextUntil("tr.rgRow,tr.rgAltRow").last().next();
                                            nextDataRow = (nextDataRow.length === 1 ? nextDataRow : $groupHeaderElement.next());
                                            var dataItems = masterTableView.get_dataItems();
                                            var fieldValue, nextDataRowElement = nextDataRow.get(0);
                                            if (nextDataRow.length === 1) {
                                                for (var i = 0, itemCount = dataItems.length; i < itemCount; i++) {
                                                    var dataItem = dataItems[i];
                                                    if (dataItem.get_element() === nextDataRowElement) {
                                                        fieldValue = dataItem.get_dataItem()[fieldName];
                                                        break;
                                                    }
                                                }
                                            }
                                            if (typeof fieldValue === "undefined") {
                                                return null;
                                            }
                                            return {
                                                key: groupLevel.toString() + fieldName + fieldValue,
                                                level: groupLevel,
                                                fieldName: fieldName
                                            };
                                        case RefreshModes.AJAX:
                                            var groupDataString = $groupHeaderElement.attr("data-gdata");
                                            if (!groupDataString || groupDataString === "") {
                                                if (console && typeof console.log === "function") {
                                                    console.log("Error, group data attribute [data-gdata] is missing.");
                                                }
                                                return null;
                                            }
                                            var groupData = JSON.parse(groupDataString);
                                            if (!groupData || typeof groupData.FieldValue === "undefined") {
                                                return null;
                                            }
                                            return {
                                                key: groupData.GroupLevel.toString() + groupData.FieldName + groupData.FieldValue,
                                                level: groupData.GroupLevel,
                                                fieldName: groupData.FieldName
                                            };
                                    }
                                }, function () {
                                    var $containerElement;
                                    if (_this.options.GridContainerSelector) {
                                        $containerElement = $(_this.options.GridContainerSelector);
                                    }
                                    else {
                                        $containerElement = _this.get_$GridDataElement();
                                    }
                                    var masterTableView = _this.get_GridMasterTableView();
                                    if (masterTableView) {
                                        return {
                                            $ScrollElement: $containerElement,
                                            PageIndex: masterTableView.get_currentPageIndex()
                                        };
                                    }
                                    return null;
                                } /*,
                            ($groupHeaderElement, toggleAction) => {
                                //TODO: This code does not work...check with Telerik to see if it's a bug
        
                                //var view = this.get_GridMasterTableView();
                                //switch (toggleAction) {
                                //	case GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
                                //		view.expandGroup($groupHeaderElement.get(0));
                                //		break;
                                //	case GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
                                //		view.collapseGroup($groupHeaderElement.get(0));
                                //		break;
                                //}
                            }*/ /*,
                            ($groupHeaderElement, toggleAction) => {
                                //TODO: This code does not work...check with Telerik to see if it's a bug
        
                                //var view = this.get_GridMasterTableView();
                                //switch (toggleAction) {
                                //	case GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
                                //		view.expandGroup($groupHeaderElement.get(0));
                                //		break;
                                //	case GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
                                //		view.collapseGroup($groupHeaderElement.get(0));
                                //		break;
                                //}
                            }*/));
                            this._AddGroupStateChangeEventHandlers();
                            this._InitializeStateTrackingMode();
                        };
                        Core.prototype._AddGroupStateChangeEventHandlers = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            this.gridGroupStateChangedHandler = function (sender, args) {
                                if (_this.groupStateCommon.get_pauseGroupStateChangeEventHandlers()) {
                                    return;
                                }
                                _this.groupStateCommon.SaveGroupStateAsync();
                            };
                            grid.add_groupExpanded(this.gridGroupStateChangedHandler);
                            grid.add_groupCollapsed(this.gridGroupStateChangedHandler);
                        };
                        Core.prototype._RemoveGroupStateChangeEventHandlers = function () {
                            var grid = this.get_Grid();
                            grid.remove_groupExpanded(this.gridGroupStateChangedHandler);
                            grid.remove_groupCollapsed(this.gridGroupStateChangedHandler);
                        };
                        //#endregion
                        Core.prototype._InitializeStateTrackingMode = function () {
                            var _this = this;
                            switch (this.options.RefreshMode) {
                                case RefreshModes.ClientDataSource:
                                    var grid = this.get_Grid();
                                    grid.add_dataBinding(function (sender, args) {
                                        _this.groupStateCommon.SaveGroupStateFinishCheck();
                                    });
                                    grid.add_dataBound(function (sender, args) {
                                        _this.groupStateCommon.RestoreGroupState();
                                    });
                                    break;
                                case RefreshModes.AJAX:
                                    var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
                                    if (!prmInstance) {
                                        if (console && typeof console.log === "function") {
                                            console.log("Error, Options.RefreshMode was set to AJAX, but there is no PageRequestManager.");
                                        }
                                        return;
                                    }
                                    prmInstance.add_beginRequest(function (sender, args) {
                                        _this._RemoveGroupStateChangeEventHandlers();
                                        _this.groupStateCommon.SaveGroupStateFinishCheck();
                                    });
                                    prmInstance.add_endRequest(function (sender, args) {
                                        _this.groupStateCommon.RestoreGroupState();
                                        _this._AddGroupStateChangeEventHandlers();
                                    });
                                    break;
                            }
                        };
                        Core.prototype.get_Grid = function () {
                            return ($find(this.options.GridClientId));
                        };
                        Core.prototype.get_GridMasterTableView = function (grid) {
                            if (!grid) {
                                grid = this.get_Grid();
                            }
                            try {
                                return grid.get_masterTableView();
                            }
                            catch (err) {
                                if (console && typeof console.log === "function") {
                                    console.log("RadGrid Group State Preservation: MasterTableView missing/error.");
                                }
                            }
                        };
                        Core.prototype.get_$GridDataElement = function () {
                            //Note: this element is available only when the grid has static headers and scrolling enabled in the grid
                            var gridDataElement = $("#" + this.options.GridClientId + "_GridData");
                            if (gridDataElement.length === 1) {
                                return gridDataElement;
                            }
                            return null;
                        };
                        Core.prototype._get_$MasterTableViewElement = function () {
                            var masterTableView = this.get_GridMasterTableView();
                            if (!masterTableView) {
                                return null;
                            }
                            return $(masterTableView.get_element());
                        };
                        Core.prototype.ResetGroupState = function () {
                            this.groupStateCommon.ResetGroupState();
                        };
                        return Core;
                    }());
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = RadGrid.GroupStatePreservation || (RadGrid.GroupStatePreservation = {}));
            })(RadGrid = TelerikCustom.RadGrid || (TelerikCustom.RadGrid = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=Core.js.map