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
                    var SaveRestoreModes;
                    (function (SaveRestoreModes) {
                        SaveRestoreModes[SaveRestoreModes["Save"] = 1] = "Save";
                        SaveRestoreModes[SaveRestoreModes["Restore"] = 2] = "Restore";
                    })(SaveRestoreModes || (SaveRestoreModes = {}));
                    var ToggleButtonState = (function () {
                        function ToggleButtonState(isExpanded, buttonElement) {
                            this.isExpanded = isExpanded;
                            this.buttonElement = buttonElement;
                        }
                        return ToggleButtonState;
                    })();
                    var GroupState = (function () {
                        function GroupState(groupData, toggleButtonState) {
                            this.groupData = groupData;
                            this.toggleButtonState = toggleButtonState;
                            this.parentGroupText = "";
                        }
                        GroupState.prototype.FullGroupText = function () {
                            return this.parentGroupText + "/" + this.groupData.key;
                        };
                        return GroupState;
                    })();
                    (function (GroupToggleActions) {
                        GroupToggleActions[GroupToggleActions["None"] = 0] = "None";
                        GroupToggleActions[GroupToggleActions["Collapse"] = 1] = "Collapse";
                        GroupToggleActions[GroupToggleActions["Expand"] = 2] = "Expand";
                    })(GroupStatePreservation.GroupToggleActions || (GroupStatePreservation.GroupToggleActions = {}));
                    var GroupToggleActions = GroupStatePreservation.GroupToggleActions;
                    var Options = (function () {
                        function Options(groupHeaderElementSelector, groupHeaderChildren_ToggleElementSelector, groupHeaderChildren_ToggleElementSelectorFilter, groupHeaderChildren_TextElementSelector, groupHeaderChildren_TextElementSelectorFilter, groupToggleElementClass_Expand, groupToggleElementClass_Collapse, delegateGetGroupKeyByRow, delegateToggleGroupByRow) {
                            if (delegateToggleGroupByRow === void 0) { delegateToggleGroupByRow = null; }
                            this.groupHeaderElementSelector = groupHeaderElementSelector;
                            this.groupHeaderChildren_ToggleElementSelector = groupHeaderChildren_ToggleElementSelector;
                            this.groupHeaderChildren_ToggleElementSelectorFilter = groupHeaderChildren_ToggleElementSelectorFilter;
                            this.groupHeaderChildren_TextElementSelector = groupHeaderChildren_TextElementSelector;
                            this.groupHeaderChildren_TextElementSelectorFilter = groupHeaderChildren_TextElementSelectorFilter;
                            this.groupToggleElementClass_Expand = groupToggleElementClass_Expand;
                            this.groupToggleElementClass_Collapse = groupToggleElementClass_Collapse;
                            this.delegateGetGroupKeyByRow = delegateGetGroupKeyByRow;
                            this.delegateToggleGroupByRow = delegateToggleGroupByRow;
                        }
                        //#region Toggle Elements
                        Options.prototype.get_ExpandToggleElementSelector = function () {
                            return this.groupHeaderElementSelector + " " + this.groupHeaderChildren_ToggleElementSelector + "." + this.groupToggleElementClass_Expand;
                        };
                        Options.prototype.get_CollapseToggleElementSelector = function () {
                            return this.groupHeaderElementSelector + " " + this.groupHeaderChildren_ToggleElementSelector + "." + this.groupToggleElementClass_Collapse;
                        };
                        Options.prototype.get_ExpandAndCollapseToggleElementsSelector = function () {
                            return this.get_ExpandToggleElementSelector() + ", " + this.get_CollapseToggleElementSelector();
                        };
                        //#endregion
                        //#region Text Elements
                        Options.prototype.get_TextElementSelector = function () {
                            var selector = this.groupHeaderElementSelector + " " + this.groupHeaderChildren_TextElementSelector;
                            return selector;
                        };
                        return Options;
                    })();
                    GroupStatePreservation.Options = Options;
                    var Core = (function () {
                        function Core(_Options) {
                            this._Options = _Options;
                            //#endregion
                            //#endregion
                            //#region Group Expanded/Collapsed State Tracking
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                            //#region Pause Processing
                            this._pauseGroupStateChangeEventHandlers = false;
                            this._currentTopLevelGroupName = null;
                            //#endregion
                            //#endregion
                            //#region Save Grouping
                            //#region Asynchronous
                            this._saveGroupingElementInterval = null;
                            //#endregion
                            //#region Scroll Position
                            this._scrollPositionsByPageIndex = [];
                            this._lastPageIndex = null;
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };
                        Core.prototype.set_tableElement = function ($element) {
                            this._$tableElement = $element;
                        };
                        Core.prototype._get_$GroupHeaderElements = function () {
                            if (!this._$tableElement || this._$tableElement.length === 0) {
                                return null;
                            }
                            return this._$tableElement.find(this._Options.groupHeaderElementSelector);
                        };
                        Core.prototype._get_$groupHeaderChildElements = function (selector, selectorFilter) {
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
                            return this._get_$groupHeaderChildElements(this._Options.groupHeaderChildren_ToggleElementSelector, this._Options.groupHeaderChildren_ToggleElementSelectorFilter);
                        };
                        Core.prototype._get_$groupToggleElementInHeader = function ($groupHeaderElement) {
                            return this._get_$GroupHeaderChildElementWithinHeader($groupHeaderElement, this._Options.groupHeaderChildren_ToggleElementSelector, this._Options.groupHeaderChildren_ToggleElementSelectorFilter);
                        };
                        //#endregion
                        //#region Text Elements
                        Core.prototype._get_$GroupTextElementsAll = function () {
                            return this._get_$groupHeaderChildElements(this._Options.groupHeaderChildren_TextElementSelector, this._Options.groupHeaderChildren_TextElementSelectorFilter);
                        };
                        Core.prototype._groupItemAdd = function (list, value) {
                            if (list.indexOf(value) === -1) {
                                list.push(value);
                            }
                        };
                        Core.prototype._groupItemRemove = function (list, value) {
                            var itemIndex = list.indexOf(value);
                            if (itemIndex > -1) {
                                list.splice(itemIndex, 1);
                            }
                        };
                        Core.prototype.set_pauseGroupStateChangeEventHandlers = function (value) {
                            this._pauseGroupStateChangeEventHandlers = value;
                        };
                        Core.prototype.get_pauseGroupStateChangeEventHandlers = function () {
                            return this._pauseGroupStateChangeEventHandlers;
                        };
                        Core.prototype._beginSaveRestore = function () {
                            this._lastGroupLevel = -1;
                            this._lastGroupKey = "";
                            this._groupLevelRootValue = -1;
                            this._currentParentGroupPathArray = [];
                        };
                        Core.prototype._getCurrentParentGroupPath = function () {
                            if (this._currentParentGroupPathArray.length === 0) {
                                return "";
                            }
                            return this._currentParentGroupPathArray.join("/");
                        };
                        Core.prototype._SaveRestoreGroupHeaderLoopHandler = function (Mode, elementIndex, groupHeaderElement) {
                            var $groupHeaderElement = $(groupHeaderElement);
                            var groupState = this._get_GroupState($groupHeaderElement);
                            this._groupHeader_GroupLevelProcessing(groupState);
                            groupState.parentGroupText = this._getCurrentParentGroupPath();
                            switch (Mode) {
                                case 1 /* Save */:
                                    this._saveGroupingForHeaderElement(groupState);
                                    break;
                                case 2 /* Restore */:
                                    this._restoreGroupingForHeaderElement(groupState, $groupHeaderElement);
                                    break;
                            }
                        };
                        /*
                         * Ensure that group tracking is reset when the top-level group changes (to prevent excessive memory consumption).
                         */
                        Core.prototype._trackTopLevelGroupChanges = function (groupState) {
                            if (groupState.groupData.level === 0) {
                                if (!this._currentTopLevelGroupName) {
                                    this._currentTopLevelGroupName = groupState.groupData.fieldName;
                                }
                                else {
                                    if (this._currentTopLevelGroupName !== groupState.groupData.fieldName) {
                                        this._currentTopLevelGroupName = groupState.groupData.fieldName;
                                        this.ResetGrouping();
                                    }
                                }
                            }
                        };
                        /**
                         * Determine nesting level/changes.
                         */
                        Core.prototype._groupHeader_GroupLevelProcessing = function (groupState) {
                            if (this._lastGroupLevel === -1) {
                                this._groupLevelRootValue = groupState.groupData.level;
                            }
                            var groupLevel = groupState.groupData.level;
                            if (groupLevel !== this._lastGroupLevel) {
                                var groupLevelChange = this._lastGroupLevel - groupLevel;
                                if (groupLevel === this._groupLevelRootValue) {
                                    this._currentParentGroupPathArray = [];
                                }
                                else if (groupLevel < this._lastGroupLevel) {
                                    for (var i = 0; i < groupLevelChange; i++) {
                                        this._currentParentGroupPathArray.pop();
                                    }
                                }
                                else if (groupLevel > this._lastGroupLevel) {
                                    this._currentParentGroupPathArray.push(this._lastGroupKey);
                                }
                            }
                            this._lastGroupLevel = groupLevel;
                            this._lastGroupKey = groupState.groupData.key;
                            this._trackTopLevelGroupChanges(groupState);
                        };
                        Core.prototype._checkToggleButton = function ($groupHeaderElement) {
                            var $toggleButtonElement = this._get_$groupToggleElementInHeader($groupHeaderElement);
                            if ($toggleButtonElement.length > 0) {
                                if ($toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Expand) || $toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Collapse)) {
                                    return {
                                        isExpanded: $toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Collapse),
                                        buttonElement: $toggleButtonElement
                                    };
                                }
                            }
                        };
                        Core.prototype._get_GroupState = function ($groupHeaderElement) {
                            var groupKey = this._get_GroupData($groupHeaderElement);
                            if (groupKey) {
                                return new GroupState(groupKey, this._checkToggleButton($groupHeaderElement));
                            }
                            return null;
                        };
                        Core.prototype._get_GroupData = function ($groupHeaderElement) {
                            if ($groupHeaderElement.length === 0) {
                                return null;
                            }
                            return this._Options.delegateGetGroupKeyByRow($groupHeaderElement);
                        };
                        //#endregion
                        //#region Save
                        Core.prototype._saveGroupingForHeaderElement = function (groupState) {
                            if (groupState) {
                                if (groupState.toggleButtonState.isExpanded) {
                                    this._groupItemAdd(this._groupsExpanded, groupState.FullGroupText());
                                    this._groupItemRemove(this._groupsCollapsed, groupState.FullGroupText());
                                }
                                else {
                                    this._groupItemAdd(this._groupsCollapsed, groupState.FullGroupText());
                                    this._groupItemRemove(this._groupsExpanded, groupState.FullGroupText());
                                }
                            }
                        };
                        //#endregion
                        //#region Restore
                        Core.prototype._restoreGroupingForHeaderElement = function (groupState, $groupHeaderElement) {
                            if (groupState) {
                                //NOTE: If a default toggle action is specified, it will execute only if the group was never in an expanded or collapsed state, e.g. when the grid first loads or is initially grouped.
                                var Action = this._defaultGroupToggleAction;
                                var fullGroupText = groupState.FullGroupText();
                                var previousGroupStateExpanded = this._groupsExpanded.indexOf(fullGroupText) !== -1;
                                var previousGroupStateCollapsed = this._groupsCollapsed.indexOf(fullGroupText) !== -1;
                                var groupIsExpanded = groupState.toggleButtonState.isExpanded;
                                if (Action !== 0 /* None */) {
                                    if ((groupIsExpanded && previousGroupStateExpanded) || (!groupIsExpanded && previousGroupStateCollapsed)) {
                                        Action = 0 /* None */;
                                    }
                                }
                                if (groupIsExpanded && previousGroupStateCollapsed) {
                                    Action = 1 /* Collapse */;
                                }
                                else if (!groupIsExpanded && previousGroupStateExpanded) {
                                    Action = 2 /* Expand */;
                                }
                                if (Action !== 0 /* None */) {
                                    if (typeof this._Options.delegateToggleGroupByRow === "function") {
                                        this._Options.delegateToggleGroupByRow($groupHeaderElement, Action);
                                    }
                                    else {
                                        groupState.toggleButtonState.buttonElement.click();
                                    }
                                }
                            }
                        };
                        Core.prototype.SaveGroupingAsync = function ($tableElement, resetGrouping) {
                            if (resetGrouping === void 0) { resetGrouping = false; }
                            //console.log("Begin save grouping...");
                            this.set_tableElement($tableElement);
                            if (resetGrouping) {
                                this.ResetGrouping();
                            }
                            this._saveGroupingWaitCheck();
                        };
                        Core.prototype._saveGroupingWaitCheck = function () {
                            if (this._saveGroupingElementInterval) {
                                this._saveGroupingAsyncStop();
                            }
                            this._saveGroupingContinue();
                        };
                        Core.prototype._saveGroupingContinue = function () {
                            var _this = this;
                            this._beginSaveRestore();
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if (!$groupHeaderElements) {
                                return;
                            }
                            var elementIndex = 0;
                            var elementsLength = $groupHeaderElements.length;
                            this._saveGroupingElementInterval = setInterval(function () {
                                for (var batchIndex = 0; batchIndex < 20 && elementIndex < elementsLength; batchIndex++) {
                                    _this._SaveRestoreGroupHeaderLoopHandler(1 /* Save */, elementIndex, $groupHeaderElements.get(elementIndex));
                                    elementIndex++;
                                }
                                if (elementIndex >= elementsLength) {
                                    _this._saveGroupingAsyncStop();
                                }
                            }, 0);
                        };
                        Core.prototype._saveGroupingAsyncStop = function () {
                            clearInterval(this._saveGroupingElementInterval);
                            this._saveGroupingElementInterval = null;
                        };
                        //#endregion
                        //#region Synchronous
                        Core.prototype._saveGrouping = function () {
                            this._beginSaveRestore();
                            var thisClass = this;
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if ($groupHeaderElements) {
                                $groupHeaderElements.each(function (elementIndex, groupHeaderElement) { return thisClass._SaveRestoreGroupHeaderLoopHandler(1 /* Save */, elementIndex, groupHeaderElement); });
                            }
                        };
                        Core.prototype.FinishSaveGroupingCheck = function ($tableElement, forceSave, resetGrouping) {
                            if (forceSave === void 0) { forceSave = false; }
                            if (resetGrouping === void 0) { resetGrouping = false; }
                            this.set_tableElement($tableElement);
                            if (resetGrouping) {
                                this.ResetGrouping();
                            }
                            if (this._saveGroupingElementInterval || forceSave) {
                                this._saveGroupingAsyncStop();
                                this._saveGrouping();
                            }
                        };
                        //#endregion
                        //#endregion
                        //#region Restore Grouping
                        Core.prototype.RestoreGrouping = function ($tableElement, defaultGroupToggleAction) {
                            if (defaultGroupToggleAction === void 0) { defaultGroupToggleAction = 0 /* None */; }
                            if (this._groupsExpanded.length === 0 && this._groupsCollapsed.length === 0 && this._defaultGroupToggleAction === 0 /* None */) {
                                return;
                            }
                            this._restoreGroupingInner($tableElement, defaultGroupToggleAction);
                        };
                        Core.prototype._restoreGroupingInner = function ($tableElement, defaultGroupToggleAction) {
                            if (defaultGroupToggleAction === void 0) { defaultGroupToggleAction = 0 /* None */; }
                            if (this._saveGroupingElementInterval) {
                                clearInterval(this._saveGroupingElementInterval);
                            }
                            this.set_tableElement($tableElement);
                            this._defaultGroupToggleAction = defaultGroupToggleAction;
                            var thisClass = this;
                            this._pauseGroupStateChangeEventHandlers = true;
                            this._beginSaveRestore();
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if ($groupHeaderElements) {
                                $groupHeaderElements.each(function (elementIndex, groupHeaderElement) { return thisClass._SaveRestoreGroupHeaderLoopHandler(2 /* Restore */, elementIndex, groupHeaderElement); });
                            }
                            this._pauseGroupStateChangeEventHandlers = false;
                        };
                        //#endregion
                        Core.prototype.ResetGrouping = function () {
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                        };
                        //#endregion
                        //#region Actions
                        Core.prototype.ToggleAllGroups = function ($tableElement, action) {
                            this.set_tableElement($tableElement);
                            this.ResetGrouping();
                            this._restoreGroupingInner($tableElement, action);
                        };
                        Core.prototype.SaveScrollPosition = function ($scrollElement, pageIndex) {
                            if ($scrollElement && $scrollElement.length === 1 && typeof pageIndex === "number") {
                                this._scrollPositionsByPageIndex[pageIndex] = $scrollElement.get(0).scrollTop;
                                //Check if scroll is at bottom
                                if ($scrollElement[0].scrollHeight - $scrollElement.scrollTop() === $scrollElement.outerHeight()) {
                                    this._scrollPositionsByPageIndex[pageIndex + 1] = 0;
                                    this._scrollPositionsByPageIndex[pageIndex - 1] = 10000;
                                }
                                this._lastPageIndex = pageIndex;
                            }
                        };
                        Core.prototype.RestoreScrollPosition = function ($scrollElement, pageIndex) {
                            if ($scrollElement && $scrollElement.length === 1 && typeof pageIndex === "number") {
                                var savedScrollTop = this._scrollPositionsByPageIndex[pageIndex];
                                if (!savedScrollTop) {
                                    savedScrollTop = 0;
                                }
                                $scrollElement.animate({
                                    scrollTop: savedScrollTop
                                });
                            }
                        };
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = GridCommon.GroupStatePreservation || (GridCommon.GroupStatePreservation = {}));
            })(GridCommon = TelerikCustom.GridCommon || (TelerikCustom.GridCommon = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=Core.js.map