using System;
using System.Data;
using System.Linq;
using Telerik.Web.UI;

namespace WebApplication2.Extenders.TelerikCustom.RadGrid.Helpers
{
	public class GroupingSupport
	{
		public static GroupData GetGroupData(Telerik.Web.UI.RadGrid grid, GridGroupHeaderItem headerItem)
		{
			GroupData data = new GroupData();
			data.GroupLevel = headerItem.GroupIndex.Split('_').Length - 1;

			data.FieldName = System.Web.HttpUtility.HtmlEncode(
				grid.MasterTableView.GroupByExpressions[Convert.ToInt32(data.GroupLevel)].GroupByFields[0].FieldName);

			DataRowView groupDataRow = (DataRowView)headerItem.DataItem;
			data.FieldValue = System.Web.HttpUtility.HtmlEncode(groupDataRow[data.FieldName].ToString());
			
			return data;
		}

		public static string GetGroupDataJson(Telerik.Web.UI.RadGrid grid, GridGroupHeaderItem headerItem)
		{
			return Newtonsoft.Json.JsonConvert.SerializeObject(GroupingSupport.GetGroupData(grid, headerItem));
		}

		public static void PreRenderGroupProcessing(Telerik.Web.UI.RadGrid grid)
		{
			GridItem[] headerItems = grid.MasterTableView.GetItems(GridItemType.GroupHeader);
			foreach (GridGroupHeaderItem headerItem in headerItems)
			{
				if (headerItem.OwnerTableView.GroupHeaderTemplate != null)
				{
					return;
				}
				headerItem.Attributes.Add("data-gdata", GroupingSupport.GetGroupDataJson(grid: grid, headerItem: headerItem));
			}
		}
	}
}