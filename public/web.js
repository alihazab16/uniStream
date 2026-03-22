document.addEventListener("DOMContentLoaded", () => {
    const order = {};

    // streamingServices now comes from server
    // let streamingServices = [];       // summary list: [{id,name,minOrder,serviceFee}, ...]
    let currentService = null;        // full service data (genres/movies) from /services?id=n
    let currentServiceIndex = null;
    let currentGenre = "All";

    //list of bunch of elements
    const select = document.getElementById("serviceSelect");
    const serviceInfo = document.getElementById("serviceInfo");
    const genreBar = document.getElementById("genreBar");
    const movieList = document.getElementById("movieList");
    const moviesTitle = document.getElementById("moviesTitle");

    const mainLayout = document.getElementById("mainLayout");
    const orderSummary = document.getElementById("orderSummary");
    const feeSummary = document.getElementById("feeSummary");
    const totalsSummary = document.getElementById("totalsSummary");
    const minMessages = document.getElementById("minMessages");
    const submitOrderBtn = document.getElementById("submitOrder");

    //confirm box for yes or no when pressing cancel
    const confirmBox = document.getElementById("confirmBox");
    const confirmText = document.getElementById("confirmText");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

    let pendingRemove = null;

    confirmYes.addEventListener("click", () => {
        if (pendingRemove) pendingRemove();
        pendingRemove = null;
        confirmBox.style.display = "none";
    });

    confirmNo.addEventListener("click", () => {
        pendingRemove = null;
        confirmBox.style.display = "none";
    });

    function askToConfirmRemove(movie, onYes) {
        confirmText.textContent = `Remove "${movie.title}" from your order?`;
        pendingRemove = onYes;
        confirmBox.style.display = "block";
    }

    //function on how page looks before anything happens
    function setBlankView() {
        serviceInfo.textContent = "";
        genreBar.innerHTML = "";
        movieList.innerHTML = "";
        moviesTitle.textContent = "Movies";

        orderSummary.innerHTML = "";
        feeSummary.innerHTML = "";
        totalsSummary.innerHTML = "";
        minMessages.innerHTML = "";

        submitOrderBtn.style.display = "none";
        mainLayout.style.display = "none";
    }

    setBlankView();

  

    // === Load streaming-services list (summary only) from server ===
    // DATA NOW COMES FROM PUG INSTEAD OF fetch("/services")

    // build empty order buckets per service name
    streamingServices.forEach(s => order[s.name] = []);

    // fill dropdown
    streamingServices.forEach((service) => {
        const opt = document.createElement("option");
        opt.value = service.id;        // IMPORTANT: value is service id now
        opt.textContent = service.name;
        select.appendChild(opt);
    });

    
    function money(n) {
        return `$${Number(n).toFixed(2)}`;
    }

    function getCurrentService() {
        return currentService; 
    }

    function isMovieSelected(serviceName, movieId) {
        return order[serviceName].some(m => m.id === movieId);
    }

    function removeMovieFromService(serviceName, movieId) {
        const idx = order[serviceName].findIndex(m => m.id === movieId);
        if (idx !== -1) order[serviceName].splice(idx, 1);
    }

    function toggleMovie(serviceName, movie) {
        if (isMovieSelected(serviceName, movie.id)) {
            removeMovieFromService(serviceName, movie.id);
        } else {
            order[serviceName].push(movie);
        }
    }

    function totalMoviesCount() {
        let c = 0;
        for (const s in order) c += order[s].length;
        return c;
    }

    //service section
   select.addEventListener("change", () => {

    const selectedId = select.value; // id now (not index)
    currentGenre = "All";

    // discard previous service data
    currentService = null;
    currentServiceIndex = streamingServices.findIndex(s => String(s.id) === String(selectedId));

    // get summary service (minOrder/serviceFee/name) from list
    const summary = (currentServiceIndex === -1) ? null : streamingServices[currentServiceIndex];
    if (!summary) return;

    serviceInfo.textContent =
        `${summary.name} | Minimum Order: ${money(summary.minOrder)} | Service Fee: ${money(summary.serviceFee)}`;

    genreBar.innerHTML = "";
    movieList.innerHTML = "";
    mainLayout.style.display = "flex";

    // fetch FULL service (genres/movies) for this service only
    fetch("/services/" + selectedId)
        .then(resp => {
            if (!resp.ok) throw new Error("Service not found");
            return resp.json();
        })
        .then(serviceData => {
            currentService = serviceData;

            createGenreItem("All");
            for (const genre in currentService.genres) {
                createGenreItem(genre);
            }

            moviesTitle.textContent = "All Movies";

            renderMovies();
            renderOrder();
        })
        .catch(err => console.error("Failed to load /services?id= :", err));
});

    //genre bar
    function createGenreItem(name) {
        const span = document.createElement("span");
        span.textContent = name;
        span.classList.add("genreItem");

        span.addEventListener("click", () => {
            currentGenre = name;
            moviesTitle.textContent = (name === "All") ? "All Movies" : `${name} Movies`;
            renderMovies();
        });

        genreBar.appendChild(span);
    }

    //movie list
    function renderMovies() {
        const service = getCurrentService();
        if (!service) return;

        movieList.innerHTML = "";

        let movies = [];
        if (currentGenre === "All") {
            for (const g in service.genres) movies = movies.concat(service.genres[g]);
        } else {
            movies = service.genres[currentGenre] || [];
        }

        movies.forEach(movie => {
            const div = document.createElement("div");
            div.classList.add("movieCard");

            const selected = isMovieSelected(service.name, movie.id);
            const iconSrc = selected ? "selected.svg" : "unselected.svg";

            div.innerHTML =
                "<div class='movieText'>" +
                `<strong>${movie.title}</strong> (${movie.year}) - ${money(movie.price)}` +
                `<p>${movie.description}</p>` +
                "</div>" +
                `<img class='movieImg' src='${iconSrc}'>`;

            const img = div.querySelector(".movieImg");

            img.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleMovie(service.name, movie);

                
                renderMovies();
                renderOrder();
            });

            movieList.appendChild(div);
        });
    }
    //order section of the assignment
    function renderOrder() {
        orderSummary.innerHTML = "";
        feeSummary.innerHTML = "";
        totalsSummary.innerHTML = "";
        minMessages.innerHTML = "";
        submitOrderBtn.style.display = "none";

       //list of movies by service
        let moviePriceSumAll = 0;
        const servicesWithMovies = [];

        streamingServices.forEach(service => {
            const items = order[service.name];
            if (items.length === 0) return;

            servicesWithMovies.push(service);

            const h3 = document.createElement("h3");
            h3.textContent = service.name;
            orderSummary.appendChild(h3);

            items.forEach(movie => {
                moviePriceSumAll += Number(movie.price);

                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.alignItems = "center";
                row.style.gap = "8px";

                const p = document.createElement("p");
                p.style.margin = "4px 0";
                p.textContent = `${movie.title} (${movie.year}) - ${money(movie.price)}`;

                const remove = document.createElement("img");
                remove.src = "remove.svg";
                remove.classList.add("removeImg");

                remove.addEventListener("click", (e) => {
                    e.stopPropagation();
                    askToConfirmRemove(movie, () => {
                        removeMovieFromService(service.name, movie.id);
                        renderOrder();
                        renderMovies(); 
                    });
                });

                row.appendChild(remove);
                row.appendChild(p);
                orderSummary.appendChild(row);
            });
        });

        if (totalMoviesCount() === 0) return;

        const feeParts = [];
        let feeTotal = 0;

        servicesWithMovies.forEach(service => {
            feeParts.push(money(service.serviceFee));
            feeTotal += Number(service.serviceFee);
        });

        const feeLine = document.createElement("p");
        feeLine.textContent =
            `Service Fees: (${feeParts.join(" + ")}) = ${money(feeTotal)}`;
        feeSummary.appendChild(feeLine);

        const subtotal = moviePriceSumAll + feeTotal;
        const tax = subtotal * 0.13;
        const total = subtotal + tax;

        const subP = document.createElement("p");
        subP.textContent = `Subtotal (movies + fees): ${money(subtotal)}`;

        const taxP = document.createElement("p");
        taxP.textContent = `Tax (13%): ${money(tax)}`;

        const totalP = document.createElement("h3");
        totalP.textContent = `Total: ${money(total)}`;

        totalsSummary.appendChild(subP);
        totalsSummary.appendChild(taxP);
        totalsSummary.appendChild(totalP);

        let anyMinNotMet = false;

        servicesWithMovies.forEach(service => {
            const movieTotalForService = order[service.name]
                .reduce((sum, m) => sum + Number(m.price), 0);

            if (movieTotalForService > 0 && movieTotalForService < service.minOrder) {
                anyMinNotMet = true;
                const remaining = service.minOrder - movieTotalForService;

                const msg = document.createElement("p");
                msg.textContent =
                    `${service.name}: add ${money(remaining)} more in movies to meet the minimum order.`;
                minMessages.appendChild(msg);
            }
        });

        if (!anyMinNotMet) {
            submitOrderBtn.style.display = "block";
        }
    }

submitOrderBtn.addEventListener("click", () => {

    const fees = {};
    const movies = {};

    let movieSubtotal = 0;
    let feeTotal = 0;

    streamingServices.forEach(service => {
        const items = order[service.name] || [];
        if (items.length === 0) return;

        fees[service.name] = Number(service.serviceFee);
        feeTotal += Number(service.serviceFee);

        movies[service.name] = items.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            price: Number(m.price),
            year: m.year
        }));

        items.forEach(m => movieSubtotal += Number(m.price));
    });

    const subtotal = movieSubtotal + feeTotal;
    const tax = subtotal * 0.13;
    const total = subtotal + tax;

    const orderData = {
        fees,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
        movies
    };

fetch("/submit-order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(orderData)
})
.then(resp => {
  if (!resp.ok) throw new Error("Order failed");
  window.location.href = "/stats";
})
.catch(err => console.error("SERVER SAID:", err.message));
})
});