using System;
using System.Linq;
using WebApplication2.Extenders.TelerikCustom.RadGrid.Helpers;

namespace WebApplication2
{
	public partial class AjaxWebForm : System.Web.UI.Page
	{
		protected void RadGrid1_NeedDataSource(object sender, Telerik.Web.UI.GridNeedDataSourceEventArgs e)
		{
			Random rnd = new Random();
			this.RadGrid1.DataSource = Enumerable.Range(1, 1000).Select(i => new
			{
				Name = string.Format("Name{0}", Math.Ceiling(Convert.ToDouble(i / rnd.Next(6, 12)))),
				Test = string.Format("Test-'{0}", Math.IEEERemainder(i, 3)),
				Desc = string.Format("Desc{0}", i),
				Loc = string.Format("Loc{0}", i),
				RandNum = rnd.Next(100)
			});
		}

		protected void RadGrid1_PreRender(object sender, EventArgs e)
		{
			GroupingSupport.PreRenderGroupProcessing(grid: this.RadGrid1);
		}
		
		protected void Button1_Click(object sender, EventArgs e)
		{
			System.Threading.Thread.Sleep(30);
			this.RadGrid1.Rebind();
		}
	}
}