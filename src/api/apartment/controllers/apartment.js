const { factories } = require("@strapi/strapi");
const { parseISO, isAfter, isBefore } = require("date-fns");

module.exports = factories.createCoreController(
  "api::apartment.apartment",
  ({ strapi }) => ({
    async findAvailable(ctx) {
      const { from, to } = ctx.query;

      if (!from || !to) {
        return ctx.badRequest('Missing "from" or "to" query parameters');
      }

      const fromDate = parseISO;
      const toDate = parseISO;

      if (isAfter(fromDate, toDate)) {
        return ctx.badRequest('"from" must be before "to"');
      }

      const apartments = await strapi.db
        .query("api::apartment.apartment")
        .findMany({
          populate: { rent_records: true },
        });

      const available = apartments.filter((apartment) =>
        (apartment.rent_records ?? []).every((record) => {
          const start = new Date(record.Start_Date);
          const end = new Date(record.End_Date);
          return isAfter(fromDate, end) || isBefore(toDate, start);
        })
      );

      ctx.body = available;
    },

    async rentApartment(ctx) {
      const { id } = ctx.params;
      const { from, to } = ctx.request.body.data || {};
      const user = ctx.state.user;

      const allRentRecords = await strapi.db
        .query("api::rent-record.rent-record")
        .findMany();

      if (!user) {
        return ctx.unauthorized("User must be logged in");
      }
      if (!from || !to) {
        return ctx.badRequest('Missing "from" or "to" in body');
      }

      const fromDate = parseISO(from);
      const toDate = parseISO(to);

      if (isAfter(fromDate, toDate)) {
        return ctx.badRequest('"from" must be before "to"');
      }

      const apartment = await strapi.db
        .query("api::apartment.apartment")
        .findOne({
          where: { id: Number(id) },
          populate: { rent_records: true },
        });

      if (!apartment) {
        return ctx.notFound("Apartment not found");
      }

      const isAvailable = (apartment.rent_records ?? []).every((record) => {
        const start = new Date(record.Start_Date);
        const end = new Date(record.End_Date);
        return isAfter(fromDate, end) || isBefore(toDate, start);
      });

      if (!isAvailable) {
        return ctx.conflict(
          "Apartment is already rented in the selected period",
          allRentRecords
        );
      }

      const startDateStr = fromDate.toISOString().slice(0, 10);
      const endDateStr = toDate.toISOString().slice(0, 10);

      const rentRecord = await strapi.db
        .query("api::rent-record.rent-record")
        .create({
          data: {
            Start_Date: startDateStr,
            End_Date: endDateStr,
            users_permissions_user: { connect: user.id },
            apartment: { connect: id },
          },
        });

      ctx.body = rentRecord;
    },

    async findRented(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized("User must be logged in");
      }

      const rentRecords = await strapi.db
        .query("api::rent-record.rent-record")
        .findMany({
          where: { users_permissions_user: user.id },
          populate: { apartment: true },
        });

      const apartments = rentRecords.map((record) => record.apartment);

      ctx.body = apartments;
    },
  })
);
