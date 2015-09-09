using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Http;
using WebApplication2.Models;

namespace WebApplication2.Controllers
{
	public class ProductsController : ApiController
	{
		static readonly IProductRepository repository = new ProductRepository();

		public IEnumerable<Product> GetAllProducts()
		{
			return repository.GetAll();
		}

		public IHttpActionResult GetProduct(int id)
		{
			var item = repository.Get(id);
			if (item == null)
			{
				throw new HttpResponseException(HttpStatusCode.NotFound);
			}
			return this.Ok(item);
		}

		public IHttpActionResult PostProduct(Product item)
		{
			item = repository.Add(item);
			string uri = this.Url.Link("DefaultApi", new { id = item.ID });
			return this.Created(new Uri(uri), item);
		}

		public void PutProduct(int id, Product product)
		{
			product.ID = id;
			if (!repository.Update(product))
			{
				throw new HttpResponseException(HttpStatusCode.NotFound);
			}
		}

		public void DeleteProduct(int id)
		{
			Product item = repository.Get(id);
			if (item == null)
			{
				throw new HttpResponseException(HttpStatusCode.NotFound);
			}
			repository.Remove(id);
		}
	}
}