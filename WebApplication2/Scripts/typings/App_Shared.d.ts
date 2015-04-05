declare module TelerikInternalProps.Web.UI {
	interface RadGrid extends Telerik.Web.UI.RadGrid {
		_groupingSettings: {
			GroupByFieldsSeparator: string;
		}
	}
}
declare var $telerik: typeof Telerik.Web.CommonScripts;