function saveChanges(){

    const name = document.getElementById("name").value;
    const serviceFee = document.getElementById("fee").value;
    const minOrder = document.getElementById("min").value;

    fetch(`/services/${serviceID}`,{
        method:"PUT",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            name,
            serviceFee,
            minOrder
        })
    })
    .then(res=>res.json())
    .then(data=>{
        alert("Changes saved");
        location.reload();
    })
    .catch(()=>{
        alert("Error saving changes");
    });

}



function addGenre(){

    const genre = document.getElementById("newGenre").value;

    if(!genre){
        alert("Genre cannot be blank");
        return;
    }

    fetch(`/services/${serviceID}/genres`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({genre})
    })
    .then(res=>{
        if(!res.ok) throw new Error();
        alert("Genre added");
        location.reload();
    })
    .catch(()=>{
        alert("Error adding genre");
    });

}



function addMovie(){

    const genre = document.getElementById("genreSelect").value;
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const year = document.getElementById("year").value;
    const price = document.getElementById("price").value;

    if(!genre || !title || !description || !year || !price){
        alert("All fields must be filled");
        return;
    }

    fetch(`/services/${serviceID}/movies`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            genre,
            title,
            description,
            year,
            price
        })
    })
    .then(res=>{
        if(!res.ok) throw new Error();
        alert("Movie added");
        location.reload();
    })
    .catch(()=>{
        alert("Error adding movie");
    });

}



function deleteMovie(mID){

    if(!confirm("Delete this movie?")) return;

    fetch(`/services/${serviceID}/movies/${mID}`,{
        method:"DELETE"
    })
    .then(res=>{
        if(!res.ok) throw new Error();
        alert("Movie deleted");
        location.reload();
    })
    .catch(()=>{
        alert("Error deleting movie");
    });

}