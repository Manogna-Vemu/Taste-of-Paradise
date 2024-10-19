const mealList = document.getElementById('meal');
const favoritesList = document.getElementById('favorites-list');
let currentPage = 1;
const mealsPerPage = 6;
let currentMeals = [];

document.getElementById('search-btn').addEventListener('click', getMealList);
document.getElementById('next-btn').addEventListener('click', nextPage);
document.getElementById('prev-btn').addEventListener('click', prevPage);

document.addEventListener('DOMContentLoaded', loadFavorites);

mealList.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite-btn')) {
        let mealId = e.target.dataset.id;
        addToFavorites(mealId);
    }
});

function showSection(sectionId) {
    const sections = ['home', 'search', 'favorites', 'about'];
    sections.forEach(section => {
        document.getElementById(section).style.display = section === sectionId ? 'block' : 'none';
    });

    if (sectionId === 'favorites') {
        loadFavorites();
    }
}

function getMealList() {
    let searchInputTxt = document.getElementById('search-input').value.trim();
    let searchType = document.getElementById('search-type').value;

    let url = '';
    if (searchType === 'ingredient') {
        url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchInputTxt}`;
    } else if (searchType === 'dish') {
        url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchInputTxt}`;
    }

    document.getElementById('loading-spinner').style.display = 'flex';
    mealList.innerHTML = ""; 

    fetch(url)
        .then(response => response.json())
        .then(data => {
            document.getElementById('loading-spinner').style.display = 'none';

            if (data.meals) {
                currentMeals = data.meals;
                displayMeals(currentPage);
            } else {
                mealList.innerHTML = "Sorry, we didn't find any meal!";
            }
        })
        .catch(error => {
            document.getElementById('loading-spinner').style.display = 'none';
            mealList.innerHTML = "Error fetching data!";
        });
}

function displayMeals(page) {
    let start = (page - 1) * mealsPerPage;
    let end = start + mealsPerPage;
    let mealsToDisplay = currentMeals.slice(start, end);

    let html = "";
    mealsToDisplay.forEach(meal => {
        html += `
            <div class="meal-item" data-id="${meal.idMeal}">
                <div class="meal-img">
                    <img src="${meal.strMealThumb}" alt="food" class="img-fluid">
                </div>
                <div class="meal-name">
                    <h3>${meal.strMeal}</h3>
                    <a href="#" class="recipe-btn btn btn-info">Get Recipe</a>
                    <a href="#" class="favorite-btn btn btn-warning" data-id="${meal.idMeal}">Add to Favorites</a>
                </div>
            </div>
        `;
    });
    mealList.innerHTML = html;
}

function nextPage() {
    if (currentPage * mealsPerPage < currentMeals.length) {
        currentPage++;
        displayMeals(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayMeals(currentPage);
    }
}

function addToFavorites(mealId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.includes(mealId)) {
        favorites.push(mealId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        loadFavorites(); 
    } else {
        alert('Already in favorites!');
    }
}

function loadFavorites() {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const emptyFavorites = document.getElementById('empty-favorites');
    const loadingSpinner = document.getElementById('loading-spinner');

    loadingSpinner.style.display = 'flex';
    favoritesList.innerHTML = ""; 

    if (favorites.length === 0) {
        emptyFavorites.style.display = 'block'; 
        loadingSpinner.style.display = 'none'; 
        return;
    }

    emptyFavorites.style.display = 'none'; 
    let html = '';
    let fetchPromises = favorites.map(mealId => {
        return fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`)
            .then(response => response.json())
            .then(data => {
                const meal = data.meals[0];
                html += `
                    <div class="favorite-meal" data-id="${meal.idMeal}">
                        <h3>${meal.strMeal}</h3>
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="img-fluid">
                        <button class="remove-favorite btn btn-danger" data-id="${meal.idMeal}">Remove</button>
                    </div>
                `;
            });
    });

    Promise.all(fetchPromises)
        .then(() => {
            favoritesList.innerHTML = html; 
            loadingSpinner.style.display = 'none'; 
        });
}

favoritesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-favorite')) {
        let mealId = e.target.dataset.id;
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites = favorites.filter(id => id !== mealId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        loadFavorites(); 
    }
});

mealList.addEventListener('click', (e) => {
    if (e.target.classList.contains('recipe-btn')) {
        let mealId = e.target.closest('.meal-item').dataset.id; 
        getRecipe(mealId); 
    }
});

function getRecipe(mealId) {
    fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`)
        .then(response => response.json())
        .then(data => {
            if (data.meals) {
                const meal = data.meals[0]; 
                displayRecipe(meal); 
            } else {
                alert("Recipe not found!");
            }
        })
        .catch(error => {
            console.error("Error fetching recipe:", error);
            alert("Error fetching recipe details!");
        });
}

function displayRecipe(meal) {
    const recipeDetails = document.getElementById('recipe-details');
    recipeDetails.innerHTML = `
        <h3>${meal.strMeal}</h3>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="img-fluid">
        <p>${meal.strInstructions}</p>
        <h4>Ingredients:</h4>
        <ul>
            ${getIngredients(meal).map(ingredient => `<li>${ingredient}</li>`).join('')}
        </ul>
    `;
    $('#recipeModal').modal('show'); 
}

function getIngredients(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) { 
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient) {
            ingredients.push(`${measure} ${ingredient}`.trim()); 
        }
    }
    return ingredients;
}

