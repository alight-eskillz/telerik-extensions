using System;
using System.Collections.Generic;
using System.Linq;

namespace WebApplication2.Models
{
	public interface IProductRepository
	{
		IEnumerable<Product> GetAll();

		Product Get(int id);

		Product Add(Product item);

		void Remove(int id);

		bool Update(Product item);
	}
}