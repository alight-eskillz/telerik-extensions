/// <reference path="../../../../../typings/app_shared.d.ts" />
/// <reference path="../../../../../typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="../../../../../typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="../../../../../typings/jquery/jquery.d.ts" />
var eSkillz;
(function (eSkillz) {
    var Extenders;
    (function (Extenders) {
        var TelerikCustom;
        (function (TelerikCustom) {
            var GridCommon;
            (function (GridCommon) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    var GridOptionsCommon = (function () {
                        function GridOptionsCommon(GridClientId, AddEventHandlers, SaveGridScrollPosition, GridContainerSelector) {
                            this.GridClientId = GridClientId;
                            this.AddEventHandlers = AddEventHandlers;
                            this.SaveGridScrollPosition = SaveGridScrollPosition;
                            this.GridContainerSelector = GridContainerSelector;
                        }
                        return GridOptionsCommon;
                    }());
                    GroupStatePreservation.GridOptionsCommon = GridOptionsCommon;
                    var ToggleButtonState = (function () {
                        function ToggleButtonState(IsExpanded, ButtonElement) {
                            this.IsExpanded = IsExpanded;
                            this.ButtonElement = ButtonElement;
                        }
                        return ToggleButtonState;
                    }());
                    var GroupState = (function () {
                        function GroupState(GroupData, ToggleButtonState) {
                            this.GroupData = GroupData;
                            this.ToggleButtonState = ToggleButtonState;
                            this.ParentGroupText = "";
                        }
                        GroupState.prototype.FullGroupText = function () {
                            return this.ParentGroupText + "/" + this.GroupData.key;
                        };
                        return GroupState;
                    }());
                    (function (GroupToggleActions) {
                        GroupToggleActions[GroupToggleActions["None"] = 0] = "None";
                        GroupToggleActions[GroupToggleActions["Collapse"] = 1] = "Collapse";
                        GroupToggleActions[GroupToggleActions["Expand"] = 2] = "Expand";
                    })(GroupStatePreservation.GroupToggleActions || (GroupStatePreservation.GroupToggleActions = {}));
                    var GroupToggleActions = GroupStatePreservation.GroupToggleActions;
                    var Setup = (function () {
                        function Setup(GridOptions, GetGridTableElement, GroupHeaderElementSelector, GroupHeaderChildren_ToggleElementSelector, GroupHeaderChildren_ToggleElementSelectorFilter, GroupHeaderChildren_TextElementSelector, GroupHeaderChildren_TextElementSelectorFilter, GroupToggleElementExpandCssClass, GroupToggleElementCollapseCssClass, GetGroupKeyByRow, GetSaveScrollPositionData, ToggleGroupByRow) {
                            if (ToggleGroupByRow === void 0) { ToggleGroupByRow = null; }
                            this.GridOptions = GridOptions;
                            this.GetGridTableElement = GetGridTableElement;
                            this.GroupHeaderElementSelector = GroupHeaderElementSelector;
                            this.GroupHeaderChildren_ToggleElementSelector = GroupHeaderChildren_ToggleElementSelector;
                            this.GroupHeaderChildren_ToggleElementSelectorFilter = GroupHeaderChildren_ToggleElementSelectorFilter;
                            this.GroupHeaderChildren_TextElementSelector = GroupHeaderChildren_TextElementSelector;
                            this.GroupHeaderChildren_TextElementSelectorFilter = GroupHeaderChildren_TextElementSelectorFilter;
                            this.GroupToggleElementExpandCssClass = GroupToggleElementExpandCssClass;
                            this.GroupToggleElementCollapseCssClass = GroupToggleElementCollapseCssClass;
                            this.GetGroupKeyByRow = GetGroupKeyByRow;
                            this.GetSaveScrollPositionData = GetSaveScrollPositionData;
                            this.ToggleGroupByRow = ToggleGroupByRow;
                        }
                        //#region Toggle Elements
                        Setup.prototype.get_ExpandToggleElementSelector = function () {
                            return this.GroupHeaderElementSelector
                                + " " + this.GroupHeaderChildren_ToggleElementSelector
                                + "." + this.GroupToggleElementExpandCssClass;
                        };
                        Setup.prototype.get_CollapseToggleElementSelector = function () {
                            return this.GroupHeaderElementSelector
                                + " " + this.GroupHeaderChildren_ToggleElementSelector
                                + "." + this.GroupToggleElementCollapseCssClass;
                        };
                        Setup.prototype.get_ExpandAndCollapseToggleElementsSelector = function () {
                            return this.get_ExpandToggleElementSelector() + ", " + this.get_CollapseToggleElementSelector();
                        };
                        //#endregion
                        //#region Text Elements
                        Setup.prototype.get_TextElementSelector = function () {
                            var selector = this.GroupHeaderElementSelector
                                + " " + this.GroupHeaderChildren_TextElementSelector;
                            return selector;
                        };
                        return Setup;
                    }());
                    GroupStatePreservation.Setup = Setup;
                    var Core = (function () {
                        function Core(setup) {
                            this.setup = setup;
                            //#endregion
                            //#endregion
                            //#region Group Expanded/Collapsed State Tracking
                            this.groupsExpanded = [];
                            this.groupsCollapsed = [];
                            //#region Pause Processing
                            this.pauseGroupStateChangeEventHandlers = false;
                            this.currentTopLevelGroupName = null;
                            this.currentParentGroupPathArray = [];
                            //#endregion
                            //#region Save Group State
                            //#region Asynchronous
                            this.saveGroupStateElementInterval = null;
                            //#endregion
                            //#region Scroll Position
                            this.scrollPositionsByPageIndex = [];
                            this.lastPageIndex = null;
                        }
                        Core.prototype.get_Setup = function () {
                            return this.setup;
                        };
                        Core.prototype._set_$TableElement = function ($element) {
                            this.$tableElement = $element;
                        };
                        Core.prototype._get_$GroupHeaderElements = function () {
                            if (!this.$tableElement || this.$tableElement.length === 0) {
                                return null;
                            }
                            return this.$tableElement.find(this.setup.GroupHeaderElementSelector);
                        };
                        Core.prototype._get_$GroupHeaderChildElements = function (selector, selectorFilter) {
                            var $elements = this._get_$GroupHeaderElements().find(selector);
                            if (selectorFilter && selectorFilter !== "") {
                                return $elements.filter(selectorFilter);
                            }
                            else {
                                return $elements;
                            }
                        };
                        Core.prototype._get_$GroupHeaderChildElementWithinHeader = function ($groupHeaderElement, selector, selectorFilter) {
                            var $element = $groupHeaderElement.find(selector);
                            if (selectorFilter && selectorFilter !== "") {
                                return $element.filter(selectorFilter);
                            }
                            else {
                                return $element;
                            }
                        };
                        //#region Expand/Collapse Elements
                        Core.prototype._get_$groupToggleElementsAll = function () {
                            return this._get_$GroupHeaderChildElements(this.setup.GroupHeaderChildren_ToggleElementSelector, this.setup.GroupHeaderChildren_ToggleElementSelectorFilter);
                        };
                        Core.prototype._get_$groupToggleElementInHeader = function ($groupHeaderElement) {
                            return this._get_$GroupHeaderChildElementWithinHeader($groupHeaderElement, this.setup.GroupHeaderChildren_ToggleElementSelector, this.setup.GroupHeaderChildren_ToggleElementSelectorFilter);
                        };
                        //#endregion
                        //#region Text Elements
                        Core.prototype._get_$GroupTextElementsAll = function () {
                            return this._get_$GroupHeaderChildElements(this.setup.GroupHeaderChildren_TextElementSelector, this.setup.GroupHeaderChildren_TextElementSelectorFilter);
                        };
                        Core.prototype._GroupItem_Add = function (list, value) {
                            if (list.indexOf(value) === -1) {
                                list.push(value);
                            }
                        };
                        Core.prototype._GroupItem_Remove = function (list, value) {
                            var itemIndex = list.indexOf(value);
                            if (itemIndex > -1) {
                                list.splice(itemIndex, 1);
                            }
                        };
                        Core.prototype.set_pauseGroupStateChangeEventHandlers = function (value) {
                            this.pauseGroupStateChangeEventHandlers = value;
                        };
                        Core.prototype.get_pauseGroupStateChangeEventHandlers = function () {
                            return this.pauseGroupStateChangeEventHandlers;
                        };
                        Core.prototype._BeginSaveRestore = function () {
                            this.lastGroupLevel = -1;
                            this.lastGroupKey = "";
                            this.groupLevelRootValue = -1;
                            this.currentParentGroupPathArray.length = 0;
                        };
                        Core.prototype._get_GroupPathParentCurrent = function () {
                            if (this.currentParentGroupPathArray.length === 0) {
                                return "";
                            }
                            return this.currentParentGroupPathArray.join("/");
                        };
                        Core.prototype._SaveRestoreGroupHeaderLoopHandler = function (Mode, elementIndex, groupHeaderElement) {
                            var $groupHeaderElement = $(groupHeaderElement);
                            var groupState = this._get_GroupState($groupHeaderElement);
                            if (!groupState) {
                                return;
                            }
                            this._GroupHeader_GroupLevelProcessing(groupState);
                            groupState.ParentGroupText = this._get_GroupPathParentCurrent();
                            switch (Mode) {
                                case 1 /* Save */:
                                    this._SaveGroupStateForHeaderElement(groupState);
                                    break;
                                case 2 /* Restore */:
                                    this._RestoreGroupStateForHeaderElement(groupState, $groupHeaderElement);
                                    break;
                            }
                        };
                        /**
                         * Ensure that group tracking is reset when the top-level group changes (to prevent excessive memory consumption).
                         * @param {GroupState} groupState
                         */
                        Core.prototype._TrackTopLevelGroupChanges = function (groupState) {
                            if (groupState.GroupData.level === 0) {
                                if (!this.currentTopLevelGroupName) {
                                    this.currentTopLevelGroupName = groupState.GroupData.fieldName;
                                }
                                else {
                                    if (this.currentTopLevelGroupName !== groupState.GroupData.fieldName) {
                                        this.currentTopLevelGroupName = groupState.GroupData.fieldName;
                                        this.ResetGroupState();
                                    }
                                }
                            }
                        };
                        /**
                         * Determine nesting level/changes.
                         * @param {GroupState} groupState
                         */
                        Core.prototype._GroupHeader_GroupLevelProcessing = function (groupState) {
                            if (this.lastGroupLevel === -1) {
                                this.groupLevelRootValue = groupState.GroupData.level;
                            }
                            var groupLevel = groupState.GroupData.level;
                            if (groupLevel !== this.lastGroupLevel) {
                                var groupLevelChange = this.lastGroupLevel - groupLevel;
                                if (groupLevel === this.groupLevelRootValue) {
                                    this.currentParentGroupPathArray.length = 0;
                                }
                                else if (groupLevel < this.lastGroupLevel) {
                                    for (var i = 0; i < groupLevelChange; i++) {
                                        this.currentParentGroupPathArray.pop();
                                    }
                                }
                                else if (groupLevel > this.lastGroupLevel) {
                                    this.currentParentGroupPathArray.push(this.lastGroupKey);
                                }
                            }
                            this.lastGroupLevel = groupLevel;
                            this.lastGroupKey = groupState.GroupData.key;
                            this._TrackTopLevelGroupChanges(groupState);
                        };
                        Core.prototype._ToggleButton_Check = function ($groupHeaderElement) {
                            var $toggleButtonElement = this._get_$groupToggleElementInHeader($groupHeaderElement);
                            if ($toggleButtonElement.length > 0) {
                                if ($toggleButtonElement.hasClass(this.setup.GroupToggleElementExpandCssClass)
                                    || $toggleButtonElement.hasClass(this.setup.GroupToggleElementCollapseCssClass)) {
                                    return {
                                        IsExpanded: $toggleButtonElement.hasClass(this.setup.GroupToggleElementCollapseCssClass),
                                        ButtonElement: $toggleButtonElement
                                    };
                                }
                            }
                        };
                        Core.prototype._get_GroupState = function ($groupHeaderElement) {
                            var groupKey = this._get_GroupData($groupHeaderElement);
                            if (groupKey) {
                                return new GroupState(groupKey, this._ToggleButton_Check($groupHeaderElement));
                            }
                            return null;
                        };
                        Core.prototype._get_GroupData = function ($groupHeaderElement) {
                            if ($groupHeaderElement.length === 0) {
                                return null;
                            }
                            return this.setup.GetGroupKeyByRow($groupHeaderElement);
                        };
                        //#endregion
                        Core.prototype._SaveGroupStateForHeaderElement = function (groupState) {
                            if (groupState) {
                                if (groupState.ToggleButtonState.IsExpanded) {
                                    this._GroupItem_Add(this.groupsExpanded, groupState.FullGroupText());
                                    this._GroupItem_Remove(this.groupsCollapsed, groupState.FullGroupText());
                                }
                                else {
                                    this._GroupItem_Add(this.groupsCollapsed, groupState.FullGroupText());
                                    this._GroupItem_Remove(this.groupsExpanded, groupState.FullGroupText());
                                }
                            }
                        };
                        Core.prototype._RestoreGroupStateForHeaderElement = function (groupState, $groupHeaderElement) {
                            if (groupState) {
                                //NOTE: If a default toggle action is specified, it will execute only if the group was never in an expanded or collapsed state, e.g. when the grid first loads or is initially grouped.
                                var Action = this.defaultGroupToggleAction;
                                var fullGroupText = groupState.FullGroupText();
                                var previousGroupStateExpanded = this.groupsExpanded.indexOf(fullGroupText) !== -1;
                                var previousGroupStateCollapsed = this.groupsCollapsed.indexOf(fullGroupText) !== -1;
                                var groupIsExpanded = groupState.ToggleButtonState.IsExpanded;
                                if (Action !== GroupToggleActions.None) {
                                    if ((groupIsExpanded && previousGroupStateExpanded)
                                        || (!groupIsExpanded && previousGroupStateCollapsed)) {
                                        Action = GroupToggleActions.None;
                                    }
                                }
                                if (groupIsExpanded && previousGroupStateCollapsed) {
                                    Action = GroupToggleActions.Collapse;
                                }
                                else if (!groupIsExpanded && previousGroupStateExpanded) {
                                    Action = GroupToggleActions.Expand;
                                }
                                if (Action !== GroupToggleActions.None) {
                                    if (typeof this.setup.ToggleGroupByRow === "function") {
                                        this.setup.ToggleGroupByRow($groupHeaderElement, Action);
                                    }
                                    else {
                                        groupState.ToggleButtonState.ButtonElement.click();
                                    }
                                }
                            }
                        };
                        Core.prototype.SaveGroupStateAsync = function (resetGroupState) {
                            if (resetGroupState === void 0) { resetGroupState = false; }
                            //console.log("Begin save group state...");
                            this._SaveScrollPosition();
                            var $tableElement = this.setup.GetGridTableElement();
                            this._set_$TableElement($tableElement);
                            if (resetGroupState) {
                                this.ResetGroupState();
                            }
                            this._SaveGroupStateWaitCheck();
                        };
                        Core.prototype._SaveGroupStateWaitCheck = function () {
                            if (this.saveGroupStateElementInterval) {
                                this._SaveGroupStateAsyncStop();
                            }
                            this._SaveGroupStateContinue();
                        };
                        Core.prototype._SaveGroupStateContinue = function () {
                            var _this = this;
                            this._BeginSaveRestore();
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if (!$groupHeaderElements) {
                                return;
                            }
                            var elementIndex = 0;
                            var elementsLength = $groupHeaderElements.length;
                            this.saveGroupStateElementInterval = setInterval(function () {
                                for (var batchIndex = 0; batchIndex < 20 && elementIndex < elementsLength; batchIndex++) {
                                    _this._SaveRestoreGroupHeaderLoopHandler(1 /* Save */, elementIndex, $groupHeaderElements.get(elementIndex));
                                    elementIndex++;
                                }
                                if (elementIndex >= elementsLength) {
                                    _this._SaveGroupStateAsyncStop();
                                }
                            }, 0);
                        };
                        Core.prototype._SaveGroupStateAsyncStop = function () {
                            clearInterval(this.saveGroupStateElementInterval);
                            this.saveGroupStateElementInterval = null;
                        };
                        //#endregion
                        //#region Synchronous
                        Core.prototype._SaveGroupState = function () {
                            this._BeginSaveRestore();
                            var thisClass = this;
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if ($groupHeaderElements) {
                                $groupHeaderElements.each(function (elementIndex, groupHeaderElement) {
                                    return thisClass._SaveRestoreGroupHeaderLoopHandler(1 /* Save */, elementIndex, groupHeaderElement);
                                });
                            }
                        };
                        Core.prototype.SaveGroupStateFinishCheck = function (forceSave, resetGroupState) {
                            if (forceSave === void 0) { forceSave = false; }
                            if (resetGroupState === void 0) { resetGroupState = false; }
                            if (!resetGroupState) {
                                this._SaveScrollPosition();
                            }
                            var $tableElement = this.setup.GetGridTableElement();
                            this._set_$TableElement($tableElement);
                            if (resetGroupState) {
                                this.ResetGroupState();
                            }
                            if (this.saveGroupStateElementInterval || forceSave) {
                                this._SaveGroupStateAsyncStop();
                                this._SaveGroupState();
                            }
                        };
                        //#endregion
                        //#endregion
                        //#region Restore Group State
                        Core.prototype.RestoreGroupState = function (defaultGroupToggleAction) {
                            var _this = this;
                            if (defaultGroupToggleAction === void 0) { defaultGroupToggleAction = GroupToggleActions.None; }
                            var $tableElement = this.setup.GetGridTableElement();
                            if (this.groupsExpanded.length === 0
                                && this.groupsCollapsed.length === 0
                                && this.defaultGroupToggleAction === GroupToggleActions.None) {
                                this._RestoreScrollPosition();
                                return;
                            }
                            this._RestoreGroupStateInner($tableElement, defaultGroupToggleAction);
                            setTimeout(function () { return _this._RestoreScrollPosition(); }, 0);
                        };
                        Core.prototype._RestoreGroupStateInner = function ($tableElement, defaultGroupToggleAction) {
                            if (defaultGroupToggleAction === void 0) { defaultGroupToggleAction = GroupToggleActions.None; }
                            if (this.saveGroupStateElementInterval) {
                                clearInterval(this.saveGroupStateElementInterval);
                            }
                            this._set_$TableElement($tableElement);
                            this.defaultGroupToggleAction = defaultGroupToggleAction;
                            var thisClass = this;
                            this.pauseGroupStateChangeEventHandlers = true;
                            this._BeginSaveRestore();
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if ($groupHeaderElements) {
                                $groupHeaderElements.each(function (elementIndex, groupHeaderElement) {
                                    return thisClass._SaveRestoreGroupHeaderLoopHandler(2 /* Restore */, elementIndex, groupHeaderElement);
                                });
                            }
                            this.pauseGroupStateChangeEventHandlers = false;
                        };
                        //#endregion
                        Core.prototype.ResetGroupState = function () {
                            this.groupsExpanded.length = 0;
                            this.groupsCollapsed.length = 0;
                            this.scrollPositionsByPageIndex.length = 0;
                            this.lastPageIndex = null;
                        };
                        //#endregion
                        //#region Actions
                        Core.prototype.ToggleAllGroups = function (action) {
                            var $tableElement = this.setup.GetGridTableElement();
                            this._set_$TableElement($tableElement);
                            this.ResetGroupState();
                            this._RestoreGroupStateInner($tableElement, action);
                        };
                        Core.prototype._SaveScrollPosition = function () {
                            if (!this.setup.GridOptions.SaveGridScrollPosition) {
                                return;
                            }
                            var data = this.setup.GetSaveScrollPositionData();
                            if (!data) {
                                return;
                            }
                            if (data.$ScrollElement && data.$ScrollElement.length === 1
                                && typeof data.PageIndex === "number") {
                                this.scrollPositionsByPageIndex[data.PageIndex] = data.$ScrollElement.get(0).scrollTop;
                                //Check if scroll is at bottom
                                if (data.$ScrollElement[0].scrollHeight - data.$ScrollElement.scrollTop() == data.$ScrollElement.outerHeight()) {
                                    this.scrollPositionsByPageIndex[data.PageIndex + 1] = 0;
                                    this.scrollPositionsByPageIndex[data.PageIndex - 1] = 10000;
                                }
                                this.lastPageIndex = data.PageIndex;
                            }
                        };
                        Core.prototype._RestoreScrollPosition = function () {
                            if (!this.setup.GridOptions.SaveGridScrollPosition) {
                                return;
                            }
                            var data = this.setup.GetSaveScrollPositionData();
                            if (!data) {
                                return;
                            }
                            if (data.$ScrollElement && data.$ScrollElement.length === 1
                                && typeof data.PageIndex === "number") {
                                var savedScrollTop = this.scrollPositionsByPageIndex[data.PageIndex];
                                if (!savedScrollTop) {
                                    savedScrollTop = 0;
                                }
                                data.$ScrollElement.animate({
                                    scrollTop: savedScrollTop
                                });
                            }
                        };
                        return Core;
                    }());
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = GridCommon.GroupStatePreservation || (GridCommon.GroupStatePreservation = {}));
            })(GridCommon = TelerikCustom.GridCommon || (TelerikCustom.GridCommon = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=core.js.map