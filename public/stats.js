document.addEventListener("DOMContentLoaded", async () => {

    try {
        const resp = await fetch("/stats-data");
        const data = await resp.json();

        const container = document.getElementById("stats");

        data.forEach(service => {
            container.innerHTML += `
                <div class="statBox">
                    <h2>${service.name}</h2>
                    <p>Total Movies Ordered: ${service.totalMovies}</p>
                    <p>Total Revenue: $${service.totalRevenue.toFixed(2)}</p>
                    <p>Average Order: $${service.avgOrder.toFixed(2)}</p>
                    <p>Most Popular: ${service.mostPopular}</p>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
    }
});