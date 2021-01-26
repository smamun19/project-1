const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector(`[name=productId]`).value;
  const csrf = btn.parentNode.querySelector(`[name=_csrf]`).value;

  const productElement = btn.closest(`article`);

  fetch(`/admin/product/` + prodId, {
    method: `delete`,
    headers: {
      "csrf-token": csrf,
    },
  })
    .then((result) => {
      productElement.remove();
    })
    .catch((err) => {
      console.log(err);
    });
};
