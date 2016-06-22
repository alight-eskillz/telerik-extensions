/// <reference path="../../../../../typings/telerik/kendo.all.d.ts" />
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
            var KendoGrid;
            (function (KendoGrid) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    var Options = (function (_super) {
                        __extends(Options, _super);
                        function Options(gridClientId, addEventHandlers, saveGridScrollPosition, gridContainerSelector, DefaultGroupState) {
                            if (addEventHandlers === void 0) { addEventHandlers = true; }
                            if (saveGridScrollPosition === void 0) { saveGridScrollPosition = false; }
                            if (gridContainerSelector === void 0) { gridContainerSelector = null; }
                            if (DefaultGroupState === void 0) { DefaultGroupState = TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None; }
                            _super.call(this, gridClientId, addEventHandlers, saveGridScrollPosition, gridContainerSelector);
                            this.DefaultGroupState = DefaultGroupState;
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
                            this.groupStateCommon =
                                new TelerikCustom.GridCommon.GroupStatePreservation.Core(new TelerikCustom.GridCommon.GroupStatePreservation.Setup(this.options, function () {
                                    return _this.get_Grid().table;
                                }, "tr.k-grouping-row", "td a", ":last", "td", ":last", "k-i-expand", "k-i-collapse", function ($groupHeaderElement) {
                                    var grid = _this.get_Grid(), nextDataRow = $groupHeaderElement.nextUntil("[data-uid]").last().next(), dataItem = grid.dataItem(nextDataRow.length === 1 ? nextDataRow : $groupHeaderElement.next()), groupLevel = $groupHeaderElement.children(".k-group-cell").length, groups = grid.dataSource.group(), fieldName = groups[groupLevel].field, fieldValue = dataItem ? dataItem[fieldName] : null;
                                    if (typeof fieldValue === "undefined") {
                                        return null;
                                    }
                                    return {
                                        key: groupLevel.toString() + fieldName + fieldValue,
                                        level: groupLevel,
                                        fieldName: fieldName
                                    };
                                }, function () {
                                    var $containerElement;
                                    if (_this.options.GridContainerSelector) {
                                        $containerElement = $(_this.options.GridContainerSelector);
                                    }
                                    else {
                                        $containerElement = _this.get_$GridContentElement();
                                    }
                                    var data = {
                                        $ScrollElement: $containerElement,
                                        PageIndex: _this.get_Grid().dataSource.page()
                                    };
                                    return data;
                                }, function ($groupHeaderElement, toggleAction) {
                                    var grid = _this.get_Grid();
                                    switch (toggleAction) {
                                        case TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
                                            grid.expandGroup($groupHeaderElement.get(0));
                                            break;
                                        case TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
                                            grid.collapseGroup($groupHeaderElement.get(0));
                                            break;
                                    }
                                }));
                            this._Initialize_BindEventHandlers();
                        };
                        //#region Event Handlers
                        Core.prototype._Initialize_BindEventHandlers = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            grid.bind("dataBinding", function (sender, args) {
                                _this.groupStateCommon.SaveGroupStateFinishCheck();
                            });
                            grid.bind("dataBound", function (sender, args) {
                                _this.groupStateCommon.RestoreGroupState(_this.options.DefaultGroupState);
                            });
                            this._GridAddToggleButtonClickHandlers();
                        };
                        Core.prototype._GridAddToggleButtonClickHandlers = function () {
                            var _this = this;
                            var grid = this.get_Grid(), commonOptions = this.groupStateCommon.get_Setup();
                            grid.table.on("click", commonOptions.get_ExpandAndCollapseToggleElementsSelector(), function (e) {
                                if (_this.groupStateCommon.get_pauseGroupStateChangeEventHandlers()) {
                                    return;
                                }
                                _this.groupStateCommon.SaveGroupStateAsync();
                            });
                        };
                        //#endregion
                        Core.prototype.get_Grid = function () {
                            return ($("#" + this.options.GridClientId).data("kendoGrid"));
                        };
                        Core.prototype.get_$GridContentElement = function () {
                            //Note: this element is available only when the grid has static headers and scrolling enabled in the grid
                            var gridDataElement = this.get_Grid().element.find(".k-grid-content");
                            if (gridDataElement.length === 1) {
                                return gridDataElement;
                            }
                            return null;
                        };
                        Core.prototype.ResetGroupState = function () {
                            this.groupStateCommon.ResetGroupState();
                        };
                        return Core;
                    }());
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = KendoGrid.GroupStatePreservation || (KendoGrid.GroupStatePreservation = {}));
            })(KendoGrid = TelerikCustom.KendoGrid || (TelerikCustom.KendoGrid = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=Core.js.map