const axios = require("axios");
const mongoose = require("./src/config");
const History = require("./src/models/history");

async function seedHistory() {
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 31; day++) {
      try {
        const response = await axios.get(`https://history.muffinlabs.com/date/${month}/${day}`);
        const { Events, Births, Deaths } = response.data.data;

        const docs = [
          ...Events.map(item => ({
            year: item.year,
            text: item.text,
            category: "event",
            date: { month: month.toString(), day: day.toString() }
          })),
          ...Births.map(item => ({
            year: item.year,
            text: item.text,
            category: "birth",
            date: { month: month.toString(), day: day.toString() }
          })),
          ...Deaths.map(item => ({
            year: item.year,
            text: item.text,
            category: "death",
            date: { month: month.toString(), day: day.toString() }
          }))
        ];

        await History.insertMany(docs);
        console.log(`Inserted ${month}/${day}`);
      } catch (error) {
        console.error(`Error fetching ${month}/${day}:`, error.message);
      }
    }
  }

  console.log("Done seeding all days");
  mongoose.connection.close();
}

seedHistory();
