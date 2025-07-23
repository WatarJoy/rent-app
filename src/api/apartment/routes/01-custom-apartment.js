module.exports = {
  routes: [
    {
      method: "GET",
      path: "/apartments/available",
      handler: "apartment.findAvailable",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/apartments/:id/rent",
      handler: "apartment.rentApartment",
      config: {
        auth: {
          strategies: ["users-permissions"],
        },
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/apartments/rented",
      handler: "apartment.findRented",
      config: {
        auth: {
          strategies: ["users-permissions"],
        },
        policies: [],
      },
    },
  ],
};
