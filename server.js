const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname,"views"));

app.use(express.json());
app.use(express.static("public"));

const SERVICES_DIR = path.join(__dirname,"streamingServices");

let streamingServices = [];
let orderHistory = [];

async function loadServices(){
    const files = await fs.promises.readdir(SERVICES_DIR);

    for(let file of files){
        if(file.endsWith(".json")){
            const data = await fs.promises.readFile(
                path.join(SERVICES_DIR,file),"utf8"
            );
            streamingServices.push(JSON.parse(data));
        }
    }
}

loadServices();

app.get("/", (req,res)=>{
    res.render("home",{page:"home"});
});

app.get("/order",(req,res)=>{

    res.render("orderForm",{
        page:"order",
        services: streamingServices
    });

});


app.post("/submit-order",(req,res)=>{

    const order = req.body;
    orderHistory.push(order);

    res.redirect("/stats");
});

app.get("/stats", (req, res) => {

    const stats = streamingServices.map(service => {

        let totalMovies = 0;
        let totalRevenue = 0;
        let orderCount = 0;
        const movieCounts = {};

        orderHistory.forEach(order => {

            if (order.movies && order.movies[service.name]) {

                orderCount++;

                order.movies[service.name].forEach(movie => {

                    totalMovies++;
                    totalRevenue += Number(movie.price);

                    movieCounts[movie.title] =
                        (movieCounts[movie.title] || 0) + 1;

                });

                if (order.fees && order.fees[service.name]) {
                    totalRevenue += Number(order.fees[service.name]);
                }
            }
        });

        let mostPopular = "None yet";
        let max = 0;

        for (let title in movieCounts) {
            if (movieCounts[title] > max) {
                max = movieCounts[title];
                mostPopular = title;
            }
        }

        const avgOrder = orderCount ? totalRevenue / orderCount : 0;

        return {
            name: service.name,
            totalMovies,
            totalRevenue: totalRevenue.toFixed(2),
            avgOrder: avgOrder.toFixed(2),
            mostPopular
        };
    });

    res.render("stats", {
        page: "stats",
        stats
    });
});

app.get("/admin",(req,res)=>{

    res.render("admin",{
        services: streamingServices
    });

});

app.get("/services", (req, res) => {

  const serviceList = streamingServices.map(service => ({
    id: service.id,
    name: service.name
  }));

  if (req.headers.accept && req.headers.accept.includes("application/json")) {

    res.json({
      count: serviceList.length,
      services: serviceList
    });

  } else {

    res.render("services", {
      page: "admin",
      services: serviceList
    });

  }

});
app.post("/services", (req, res) => {

  const name = req.body.name;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Service name cannot be blank" });
  }

  const newService = {
    id: streamingServices.length + 1,
    name: name.trim(),
    servicefee: 0,
    minOrder:0,
    movies: [],
    genres: {}
  };

  streamingServices.push(newService);

  res.json({ success: true });

});

app.delete("/services/:id", (req, res) => {

  const id = Number(req.params.id);

  const index = streamingServices.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Service not found" });
  }

  streamingServices.splice(index, 1);

  res.json({ success: true });

});


app.get("/services/:id", (req, res) => {

  const id = parseInt(req.params.id);

  const service = streamingServices.find(s => s.id === id);

  if (!service) {
    res.status(404).send("Service not found");
    return;
  }

  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    res.render("serviceInfo", { service });
  } else {
    res.json(service);
  }

});

app.put("/services/:sID", (req, res) => {

  const id = Number(req.params.sID);
  const service = streamingServices.find(s => s.id === id);

  if (!service) {
    return res.status(404).send("Invalid service ID");
  }

  const { name, serviceFee, minOrder } = req.body;

  if (!name || serviceFee == null || minOrder == null) {
    return res.status(400).send("Missing fields");
  }

  service.name = name;
  service.serviceFee = Number(serviceFee);
  service.minOrder = Number(minOrder);

  res.json({ message: "Service updated successfully" });

});

app.post("/services/:sID/genres", (req, res) => {

  const id = Number(req.params.sID);
  const service = streamingServices.find(s => s.id === id);

  if (!service) {
    return res.status(404).send("Service not found");
  }

  const genre = req.body.genre;

  if (!genre || genre.trim() === "") {
    return res.status(400).send("Genre name missing");
  }

  if (service.genres[genre]) {
    return res.status(400).send("Genre already exists");
  }

  service.genres[genre] = [];

  res.json({ message: "Genre added" });

});

app.post("/services/:sID/movies", (req, res) => {

  const id = Number(req.params.sID);
  const service = streamingServices.find(s => s.id === id);

  if (!service) {
    return res.status(404).send("Service not found");
  }

  const { genre, title, description, year, price } = req.body;

  if (!genre || !title || !description || !year || !price) {
    return res.status(400).send("Missing movie fields");
  }

  if (!service.genres[genre]) {
    return res.status(400).send("Genre does not exist");
  }

  const newMovie = {
    id: Date.now(),   // ensures unique ID
    title,
    description,
    year: Number(year),
    price: Number(price)
  };

  service.genres[genre].push(newMovie);

  res.json({ message: "Movie added" });

});

app.delete("/services/:sID/movies/:mID", (req, res) => {

  const sID = Number(req.params.sID);
  const mID = Number(req.params.mID);

  const service = streamingServices.find(s => s.id === sID);

  if (!service) {
    return res.status(404).send("Service not found");
  }

  for (const genre in service.genres) {

    const index = service.genres[genre].findIndex(m => m.id === mID);

    if (index !== -1) {
      service.genres[genre].splice(index, 1);
      return res.json({ message: "Movie deleted" });
    }

  }

  res.status(404).send("Movie not found");

});


app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`);
});