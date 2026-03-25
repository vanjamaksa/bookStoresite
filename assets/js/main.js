const BASE_URL = "assets/data/";
const CART_KEY="cartItems";
const MAX_QNT=10;
const MIN_QNT=1;
const PRODUCTS_NUM=6;

let currentPage=1;
let filterBooks=[];



function ajaxCallBack(filename, onSuccess){
    jQuery.ajax({
        url: BASE_URL + filename,
        method: "get",
        dataType: "json",
        success: onSuccess,
        error: function(jqXHR, exception){
            let msg = "";
            if(jqXHR.status === 0){
                msg = "Not connect. Verify Network.";
            } else if(jqXHR.status == 404){
                msg = "Requested page not found. [404]";
            } else if(jqXHR.status == 500){
                msg = "Internal Server Error [500].";
            } else if(exception === "parsererror"){
                msg = "Requested JSON parse failed.";
            } else {
                msg = "Uncaught Error: " + jqXHR.responseText;
            }
            showToast(msg);
        }
    });
}
window.onload=function(){
    initializeCartStorage();
    initializeCommonPage();
    
    
    const page=document.body.dataset.page;
    if(page=="home"){
            printServices();
        }
    if(page=="books"){
        
        initializeBooksPage();
    }
    if(page=="cart"){
        initializeCartPage();
        
    }
    if(page=="contact"){
    const form = document.getElementById("checkoutForm");

    if (form) {
        form.addEventListener("submit", handleCheckout);
    }
    }
}
function initializeCartStorage(){
   if(!getFromLS(CART_KEY)){
    saveToLS(CART_KEY,[]);
   }
}
function initializeCommonPage(){
    
    ajaxCallBack("nav.json", function(arrNav){
        saveToLS("arrNav", arrNav);
        printNavMenu();
        updateCartCount();
    });

    ajaxCallBack("services.json", function(arrServices){
        saveToLS("arrServices", arrServices);
        
    });
    ajaxCallBack("reviews.json", function(arrReviews){
        renderReviews(arrReviews);
    });
     $(document).on("click", ".minusBtn", function(){
        console.log("Klik radi");
        updateCartQuantity(parseInt($(this).data("id")), -1);
    });

    $(document).on("click", ".plusBtn", function(){
        updateCartQuantity(parseInt($(this).data("id")), 1);
    });
    $(document).on("click", ".remove-btn",function(){
        removeFromCart(parseInt($(this).data("id")));
       
    })
    $(document).on("click", ".clear-btn", clearCart);
    $(document).on("click", ".checkout-btn", function(){
        console.log("KLIK RADI")
        window.location.href = "contact.html";
    });
}
function initializeBooksPage(){
    $.when(
        $.getJSON(BASE_URL + "authors.json"),
        
        $.getJSON(BASE_URL + "flags.json"),
        $.getJSON(BASE_URL + "genres.json"),
        $.getJSON(BASE_URL + "books.json")
    ).done(function(authorsRes,  flagsRes, genresRes, booksRes){

        const arrAuthors = authorsRes[0];
        
        const arrFlags = flagsRes[0];
        const arrGenres = genresRes[0];
        const arrBooks = booksRes[0];

        saveToLS("arrAuthors", arrAuthors);
        
        saveToLS("arrFlags", arrFlags);
        saveToLS("arrGenres", arrGenres);
        saveToLS("arrBooks", arrBooks);

        printFilters();
        printAuthorsGenres();

        bindBooksEvents();
        resetFiltersUI();
        

        filterBooks = [...arrBooks];
        renderBooks(filterBooks);
        renderPagination();
        //filterAndSort();
    }).fail(function(){
        console.log("Greška pri učitavanju podataka.");
    });
    $(document).on("click", ".btn-page", function(){
        currentPage = parseInt($(this).data("page"));
        renderBooks(filterBooks);
        renderPagination();
    });
    $(document).on("click", ".cart-btn", function(){
        addToCart(parseInt($(this).data("id")));
        
    });
    $(document).on("click", ".details-btn", function(){
    let id = $(this).data("id");

    printSingleBook(id);

    let modal = new bootstrap.Modal(document.getElementById("bookModal"));
    modal.show();
    });

}
function initializeCartPage(){
    ajaxCallBack("books.json", function(arrBooks){
        saveToLS("arrBooks", arrBooks);
            ajaxCallBack("authors.json", function(arrAuthors){
                saveToLS("arrAuthors", arrAuthors);
                renderCart();
                updateCartCount();
            });       
    });
}
function saveToLS(nameLS, valueLS){
    localStorage.setItem(nameLS, JSON.stringify(valueLS));
}

function getFromLS(nameLS){
    return JSON.parse(localStorage.getItem(nameLS));
}
function bindBooksEvents(){
    document.getElementById("applyFilters").addEventListener("click", filterAndSort);
    document.getElementById("sortSelect").addEventListener("change", filterAndSort);
    document.getElementById("searchInput").addEventListener("keyup", filterAndSort);
    document.getElementById("resetFilters").addEventListener("click", resetFilters);

    $("#priceRange").on("input", function(){
        $("#priceValue").text($(this).val() + " €");
        filterAndSort();
        
    });

    
}

//FUNCTIONS FOR DINAMIC PRINTING
function printNavMenu(){
    let html="";
    let listNav=getFromLS("arrNav");
    for(let nav of listNav){
        html+=`
            <li class="nav-item"><a class="nav-link" href="${nav.href}">${nav.name}</a></li>
        `;
    }
    html+=`<li class="nav-item"><a class="nav-link cart-link" href="cart.html"><i class="fa-solid fa-cart-shopping"></i><span id="cart-count">0</span></a></li>`;
    return document.querySelector(".navbar-nav").innerHTML=html;
}
function printServices(){
    let html=`
        <div class="container">
                <div class="text-center">
                    <h2 class="section-heading text-uppercase">Why Choose Our Bookstore</h2>
                    <h3 class="section-subheading text-muted">Everything you need for a simple and enjoyable book shopping experience.</h3>
                </div>

                <div class="row text-center section-gray">
    `;
    let listServices=getFromLS("arrServices");
   
    for(let s of listServices){
        html+=`   
        <div class="col-md-4" >
            <span class="fa-stack fa-4x service-icon">
                <i class="fas fa-circle fa-stack-2x"></i>
                <i class="fas fa-${s.class} fa-stack-1x fa-inverse"></i>
            </span>
            <h4 class="my-3">${s.title}</h4>
                <p class="text-muted">
                    ${s.text}
                </p>
        </div>
        `;
    }
    html+=`
        </div>
    </div>
    `;
    return document.querySelector("#services").innerHTML=html;
}
function printAuthorsGenres(){
    let authors=getFromLS("arrAuthors");
    let genres=getFromLS("arrGenres");
    let html=`<h6 class="filter-subtitle">Author</h6>
            <select id="ddlAuthor" class="form-select">
                <option value="0">Select author</option>`;
    for(let a of authors){
            html+=`
                <option value="${a.id}">${a.name}</option>
            `;
    }
    html+=`
        </select>
        
        <h6 class="filter-subtitle">Genre</h6>
        <select id="ddlGenre" class="form-select">
        <option value="0">Select genre</option>
    `;
    for(let g of genres){
        html+=`
            <option value="${g.id}">${g.name}</option>
        `;
    }
    html+=`</select>`;
    return document.querySelector(".filter-select").innerHTML=html;
}
function printFilters(){
    let flags=getFromLS("arrFlags");
    let html = `
        <div class="mb-4">
            <h6 class="filter-subtitle">Discount</h6>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="discountOnly">
                <label class="form-check-label" for="discountOnly">
                    Only discounted books
                </label>
            </div>
        </div>

        <div class="mb-4">
            <h6 class="filter-subtitle">Flags</h6>
    `;

    for(let f of flags){
        html += `
            <div class="form-check">
                <input class="form-check-input flag-filter" 
                       type="checkbox" 
                       name="flagChecked"
                       value="${f.id}" 
                       id="flag${f.id}">
                <label class="form-check-label" for="flag${f.id}">
                    ${f.name}
                </label>
            </div>
        `;
    }

    html += `
        </div>

        <div class="mb-4">
            <h6 class="filter-subtitle">Price range</h6>

            <input
                type="range"
                class="form-range"
                id="priceRange"
                min="0"
                max="30"
                step="1"
                value="30"
            >

            <div class="d-flex justify-content-between">
                <small>0 €</small>
                <small id="priceValue">30 €</small>
            </div>
            
    `;

    document.querySelector(".filter-checked").innerHTML = html;
    $("#priceValue").text($("#priceRange").val() +"€");
    $("#priceRange").on("input", function(){
        $("#priceValue").text($(this).val() + "€");
    });
}
function getReviewCard(review){
    return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100 border-0 shadow-sm review-card text-center p-4">
                
                <div class="review-img-wrapper mx-auto mb-3">
                    <img src="${review.image}" alt="${review.name}" class="review-img">
                </div>

                <div class="mb-3">
                    <div class="rating">${printRatingStars(review.rating)}</div>
                </div>

                <p class="text-muted review-comment">
                    "${review.comment}"
                </p>

                <h5 class="mb-1">${review.name}</h5>
                <p class="text-muted small mb-0">${review.role}</p>
            </div>
        </div>
    `;
}
function renderReviews(arrReviews){
    let wrapper = document.querySelector("#reviewsWrapper");

    if(!wrapper) return;

    let html = "";

    for(let review of arrReviews){
        html += getReviewCard(review);
    }

    wrapper.innerHTML = html;
}

//FUNCTION FILTERS AND SORT
function filterAndSort(){
    

    let allBooks = getFromLS("arrBooks");
    if(!allBooks){
        return;
    }

   

    filterBooks = [...allBooks];
   

    const selectedAuthorID = parseInt($("#ddlAuthor").val() || "0");
    const selectedGenreID = parseInt($("#ddlGenre").val() || "0");
    const discountChecked = $("input[name='discountOnly']").is(":checked");
    const flagsCheckedId = $("input[name='flagChecked']:checked").map(function(){
        return parseInt($(this).val());
    }).get();
    const priceRangeValue = parseFloat($("#priceRange").val() || "30");
    const searchTerm = ($("#searchInput").val() || "").trim().toLowerCase();
    const sortSelected = $("#sortSelect").val() || "0";


    if(selectedAuthorID !== 0){
        filterBooks = filterBooks.filter(book => Number(book.authorId) === selectedAuthorID);
        
    }

    if(selectedGenreID !== 0){
        filterBooks = filterBooks.filter(book =>
            Array.isArray(book.genreIds) &&
            book.genreIds.map(id => Number(id)).includes(selectedGenreID)
        );
        
    }

    if(discountChecked){
        filterBooks = filterBooks.filter(book => book.pricing.discount);
        
    }

    if(flagsCheckedId.length > 0){
        filterBooks = filterBooks.filter(book =>
            Array.isArray(book.flagIds) &&
            book.flagIds.some(f => flagsCheckedId.includes(Number(f)))
        );
        
    }

    if(priceRangeValue < 30){
        filterBooks = filterBooks.filter(book =>
            (book.pricing.price / 117) <= priceRangeValue
        );
        
    }

    if(searchTerm){
        filterBooks = filterBooks.filter(book =>
            book.title.toLowerCase().includes(searchTerm)
        );
        
    }

    switch(sortSelected){
        case "priceAsc":
            filterBooks.sort((a,b)=> getPriceForSort(a.pricing.price, a.pricing.discount) - getPriceForSort(b.pricing.price, b.pricing.discount));
            break;
        case "priceDesc":
            filterBooks.sort((a,b)=> getPriceForSort(b.pricing.price, b.pricing.discount) - getPriceForSort(a.pricing.price, a.pricing.discount));
            break;
        case "titleAsc":
            filterBooks.sort((a,b)=> a.title.localeCompare(b.title));
            break;
        case "titleDesc":
            filterBooks.sort((a,b)=> b.title.localeCompare(a.title));
            break;
        case "rating":
            filterBooks.sort((a,b)=> b.rating - a.rating);
            break;
    }

    
    renderBooks(filterBooks);
    renderPagination();
}
function resetFiltersUI(){
    $("#ddlAuthor").val("0");
    $("#ddlGenre").val("0");
    $("input[name='discountOnly']").prop("checked", false);
    $("input[name='flagChecked']").prop("checked", false);
    $("#priceRange").val(30);
    $("#priceValue").text("30 €");
    $("#searchInput").val("");
    $("#sortSelect").val("0");
}
function resetFilters(){
    resetFiltersUI();

    let allBooks = getFromLS("arrBooks");
    filterBooks = [...allBooks];

    renderBooks(filterBooks);
    renderPagination();
    
}

//FUNCTION FOR PRINTING PRODUCTS
function renderBooks(arrBooks){
   
    const booksRegion=document.querySelector("#booksContainer");
    if(!booksRegion){
        return;
    }
    let html="";
    if(!arrBooks || arrBooks.length === 0){
        booksRegion.innerHTML = `<div class="col-12"><p class="alert alert-danger">No products available.</p></div>`;
        return;
    }
    else{
        const start=(currentPage - 1) * PRODUCTS_NUM;
        const end=start+PRODUCTS_NUM;
        const booksForPage=arrBooks.slice(start, end);
        for(let book of booksForPage){
        html+=`
        <div class="col-lg-4 col-md-6 col-12 mb-a-4">
            <div class="book-card" data-id="${book.id}">
                <div class="book-top">
                    <div class="book-flags">
                        ${getFlagsName(book.flagIds)}
                    </div>
                   
                </div>
                
                    <div class="book-img-wrap">
                        <img src="${book.img}" alt="${book.title}" class="book-img">
                       ${getDiscountName(book.pricing.discount)}
                    </div>
                    <div class="book-info">
                        <h5 class="book-title">${book.title}</h5>
                        <p class="book-author">${getDataById(book.authorId,"arrAuthors")}</p>
                        <div class="rating">${printRatingStars(book.rating)}</div>
                        <p class="book-genre">${getGenreNames(book.genreIds)}</p>
                        <div class="book-price-wrap">
                            ${getFinalPrice(book.pricing.price,book.pricing.discount)}
                        </div>
                    </div>
                
                <div class="book-bottom">
                    <button class="btn btn-outline-secondary details-btn me-2" data-id="${book.id}">
                        View details
                    </button>
                    <button class="cart-btn " data-id="${book.id}">
                        <i class="fa-solid fa-cart-shopping"></i>
                    </button>
                </div>
            </div>
        </div>`
        ;
    };
    //console.log("RENDER DOBIO:",booksRegion.map(b=>b.tile));
    booksRegion.innerHTML=html;
    }
    
};
function renderPagination(){
    let pagination = document.querySelector("#pagination");
    if(!pagination){
        return;
    }
    const totalPages = Math.ceil(filterBooks.length / PRODUCTS_NUM);
    if(totalPages <= 1){
        pagination.innerHTML = "";
        return;
    }
    let html = "";
    for(let i = 1; i <= totalPages; i++){
        html += `<li class="page-item ${i === currentPage ? "active" : ""}"><button class="page-link btn-page" data-page="${i}">${i}</button></li>`;
    }
    pagination.innerHTML = html;
}

//FUNCTIONS FOR PRODUCTS PRINTING
function getDataById(id,nameLS){
    let arrLS = getFromLS(nameLS);
    if(!arrLS){
        return "";
    }
    let item = arrLS.find(obj => obj.id == id);
    return item ? item.name : "";
}
function getFinalPrice(price,discount){
    
    if(!discount){
        return `<span class="new-price"> ${(price / 117).toFixed(1)} €</span>`;
    }
    else{
        let newPrice=price-(price*(discount/100));
        return `<span class="old-price">${(price / 117).toFixed(1)} €</span>
                            <span class="new-price">${(newPrice / 117).toFixed(1)} €</span>`;

    }
}
function getPriceForSort(price,discount){
    if(!discount){
        return (price/117).toFixed(2);
    }
    return ((price - (price*(discount / 100)))/117).toFixed(2);
}
function getFlagsName(flagIds){
    let listFlags=getFromLS("arrFlags");
    if(!listFlags || !flagIds ||!flagIds.length){
        return [];
    }
    let html="";
    for(let id of flagIds){
        let flag=listFlags.find(x=>Number(x.id)==id);
        if(flag){
            let badgeClass="";
            switch(flag.id){
                case 1:
                    badgeClass="badge-featured";
                    break;
                case 2:
                    badgeClass="badge-bestseller";
                    break;
                case 3:
                    badgeClass="badge-new";
                    break;
                default:
                    badgeClass="";
            }
            html+=`<span class="book-flag ${badgeClass}">${flag.name}</span>`
        }
    }
    return html;
}
function getGenreNames(genreIds){
    let genres=getFromLS("arrGenres");
    if(!genres || !genreIds || !genreIds.length){
        return [];
    }
    let names=[];
    for(let id of genreIds){
        let genre=genres.find(g=>Number(g.id)==id);
        if(genre){
            names.push(genre.name)
        }
    }
    return names.join(", ");
}
function getDiscountName(discount){
   let html=``;
   if(discount){
    html= `<span class="book-discount">${discount}%</span>`;
   }
   return html;
}
function printRatingStars(rate){
    let stars="";
    let fullStars=Math.floor(rate);
    for(let i=0 ; i<fullStars ; i++){
        stars+="★";
    }
    for(let i=fullStars ; i<5 ; i++){
        stars+="☆"
    }
    return stars;
}

//FUNCTION FOR MODAL PRINTING
function printSingleBook(bookId){
    const book = filterBooks.find(x => x.id == bookId);

    if(!book) return;

    const author = getDataById(book.authorId, "arrAuthors");
    const genres = getGenreNames(book.genreIds);
    //const flags = getFlagsName(book.flagIds);
    //const finalPrice = getFinalPrice(book.pricing.price, book.pricing.discount);

    

    let stockText = book.stock ? "Available" : "Currently unavailable";

    let html = `
        <div class="container-fluid">
            <div class="row g-4 align-items-start">
                <div class="col-md-5 text-center">
                    
                    <img src="${book.img}" alt="${book.title}" class="img-fluid rounded shadow book-modal-img"/>
                    <p class=" mb-2"><strong>Author:</strong> ${author}</p>
                </div>
                <div class="col-md-7">
                <h2 class="book-modal-title">${book.title}</h2>
                    <div class="book-description mb-4">
                        <h5>Description</h5>
                        <p>${book.description.short}</p>
                    </div>
                    <p class="mb-2"><strong>Genre:</strong> ${genres}</p>
                    <p class="mb-2"><strong>Language:</strong> ${book.publication.language}</p>
                    <p class="mb-2"><strong>Pages:</strong> ${book.publication.pages}</p>
                    <p class="mb-2"><strong>Publication year:</strong> ${book.publication.year}</p>
                    <p class="mb-2"><strong>Rating:</strong> ${printRatingStars(book.rating)}</p>
                    <p class="mb-2"><strong>Status:</strong> ${stockText}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div class="book-price">
                            ${getFinalPrice(book.pricing.price, book.pricing.discount)}
                        </div>
                        <button class="cart-btn " data-id="${book.id}">
                            <i class="fa-solid fa-cart-shopping"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector("#bookModalBody").innerHTML = html;
}

//FUNCTIONS FOR CART
function getCartItems(){
    return getFromLS(CART_KEY) || [];
}
function addToCart(productID){
    let cart= getCartItems();
    let item=null;
    
    for(let i=0; i<cart.length;i++){
        if(cart[i].productID===productID){
            item=cart[i];
        }
    }
    if(item){
        if(item.quantity>=MAX_QNT){
            showToast("Maximum quantity reached!");
            return;
        }
        item.quantity=item.quantity + 1;
    }
    else{
        cart.push({
            productID: productID,
            quantity: 1
        });
    }
    saveToLS(CART_KEY, cart);
    updateCartCount();
    renderCart();
    showToast("Added to cart.")
}
function showToast(message){
    let toast = document.createElement('div');
    toast.className = 'shop-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function(){
        toast.classList.add('show');
    });

    setTimeout(function(){
        toast.classList.remove('show');
        setTimeout(function(){
            toast.remove();
        }, 200);
    }, 1800);
}
function findProductById(productID){
    let books=getFromLS("arrBooks");
    for(let i=0; i<books.length; i++){
        if(books[i].id===Number(productID)){
            return books[i];
        }
    }
    return null;
}
function removeFromCart(productID){
    let cart=getCartItems();
    let next=[];
    for (let i = 0; i < cart.length; i++) {
    if (cart[i].productID !== productID) {
      next.push(cart[i]);
    }
    }
    saveToLS(CART_KEY,next);
    updateCartCount();
    renderCart();
}
function clearCart(){
    saveToLS(CART_KEY, []);
    //cartCount=0;
    updateCartCount();
    renderCart();
}
function updateCartCount(){
    let badge = document.querySelector("#cart-count");
    if(!badge){
        return;
    }
    let cartItems = getCartItems();
    let totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalQuantity;
}
function updateCartQuantity(productID, delta){
    let cartItems=getCartItems();
    let item=null;

    for(let i=0; i<cartItems.length; i++){
        if(cartItems[i].productID===productID){
            item=cartItems[i];
        }
    }
    if(!item){
        return;
    }
    if(delta < 0 && item.quantity == MIN_QNT){
        showToast("Minimum quantity is 1.");
        return;
    }
    if(delta > 0 && item.quantity >= MAX_QNT){
        showToast("Maximum quantity is 10.");
        return;
    }
    item.quantity += delta;
    saveToLS(CART_KEY, cartItems);
    updateCartCount();
    renderCart();
}
function renderCart(){
    const cartRegion=document.querySelector("#cartItems");
    if(!cartRegion){
        return;
    }
    let cartItems=getCartItems();
   

    if(cartItems.length===0){
        cartRegion.innerHTML=`
                <div class="text-center mb-5">
                    <h2 class="section-heading text-uppercase text-white">Your cart is empty</h2>
                    <h3 class="section-subheading text-white">
                        Looks like you haven't added anything yet.
                    </h3>
                    <a href="books.html" class="btn btn-main mt-3">Continue Shopping</a>
                </div>
        `;
        return;
    }
    let total=null;
    let totalQuantity=null;
    let rows=``;

    for(let i=0; i<cartItems.length; i++){
        let item=cartItems[i];
        let product=findProductById(Number(item.productID));

        if(!product){
            console.log("Product not found");
            continue;
        }
        let rowTotal=getPriceForSort(product.pricing.price, product.pricing.discount)*item.quantity;
        totalQuantity+=item.quantity;
        total+=rowTotal;
        rows+=`
            <!-- Cart Item -->
          <div class="cart-item">
            <div class="row align-items-center">
              <div class="col-md-2 text-center">
                <img src="${product.img}"alt="${product.title}" class="img-fluid" />
              </div>

              <div class="col-md-3">
                <h5 class="product-title">${product.title}"</h5>
                <p class="text-muted mb-0">${getDataById(product.authorId,"arrAuthors")}</p>
              </div>

              <div class="col-md-2 text-center">
                <p class="mb-1 text-muted">Price</p>
                <p class="product-price mb-0">${getPriceForSort(product.pricing.price, product.pricing.discount)} €</p>
              </div>

              <div class="col-md-3 text-center">
                <p class="mb-1 text-muted">Quantity</p>
                <div class="quantity-box justify-content-center">
                  <button type="button"class="minusBtn"data-id="${product.id}">-</button>
                  <span>${item.quantity}</span>
                  <button type="button"class="plusBtn"data-id="${product.id}">+</button>
                </div>
              </div>

              <div class="col-md-2 text-center">
                <p class="mb-1 text-muted">Total</p>
                <p class="product-total mb-2">${(getPriceForSort(product.pricing.price, product.pricing.discount) * item.quantity).toFixed(2)} €</p>
                <button class="btn btn-outline-danger btn-sm remove-btn" data-id="${product.id}">Remove</button>
              </div>
            </div>
          </div>
        `;
        
    }
    let html=`
                <div class="text-center mb-5">
                    <h2 class="section-heading text-uppercase text-white">My Cart</h2>
                    <h3 class="section-subheading text-white">
                        Review your selected products and update quantities.
                    </h3>
                </div>
                <div class="row g-4">
                <!-- LEFT SIDE - CART ITEMS -->
                    ${rows}
                </div>
                 <!-- RIGHT SIDE - SUMMARY -->
                <div class="col-lg-4">
                <div class="summary-box">
                    <h4>Cart Summary</h4>

                    <div class="summary-row">
                    <span>Items</span>
                    <span>${totalQuantity}</span>
                    </div>

                    <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${(total).toFixed(2)} €</span>
                    </div>

                    <div class="summary-row summary-total">
                    <span></span>
                    <span>${(total).toFixed(2)} €</span>
                    </div>

                    <div class="d-grid gap-2 mt-4">
                    <button class="btn btn-main checkout-btn">Checkout</button>
                    <button class="btn btn-outline-danger clear-btn">Clear Cart</button>
                    </div>
                </div>
                </div>
            </div>
    `;
    cartRegion.innerHTML=html;
}
//FUNCTIONS FOR FORM
function handleCheckout(e) {
    e.preventDefault();

    let isValid = validateCheckoutForm();

    if (isValid) {
        localStorage.removeItem(CART_KEY); 
        updateCartCount();
        document.getElementById("checkoutForm").reset();
        showToast("Your order has been successfully completed!");
    }
}
function validateCheckoutForm() {
    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const address = document.getElementById("address");
    const city = document.getElementById("city");
    const note = document.getElementById("note");
    const terms = document.getElementById("terms");
    const payment = document.querySelector("input[name='payment']:checked");

    const fullNameError = document.getElementById("fullNameError");
    const emailError = document.getElementById("emailError");
    const phoneError = document.getElementById("phoneError");
    const addressError = document.getElementById("addressError");
    const cityError = document.getElementById("cityError");
    const paymentError = document.getElementById("paymentError");
    const noteError = document.getElementById("noteError");
    const termsError = document.getElementById("termsError");

    clearErrors();

    let valid = true;

    // REGEX
    const fullNameRegex = /^[A-ZČĆŠĐŽ][a-zčćšđž]{1,14}\s[A-ZČĆŠĐŽ][a-zčćšđž]{1,19}$/;
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    const phoneRegex = /^(\+3816\d{7,8}|06\d{7,8})$/;
    const addressRegex = /^[A-ZČĆŠĐŽa-zčćšđž0-9\s.,/-]{5,50}$/;
    const noteRegex = /^.{0,200}$/;

    if (!fullNameRegex.test(fullName.value.trim())) {
        fullNameError.textContent = "Enter a valid full name.";
        valid = false;
    }

    if (!emailRegex.test(email.value.trim())) {
        emailError.textContent = "Enter a valid email address.";
        valid = false;
    }

    if (!phoneRegex.test(phone.value.trim())) {
        phoneError.textContent = "Enter a valid phone number.";
        valid = false;
    }

    if (!addressRegex.test(address.value.trim())) {
        addressError.textContent = "Enter a valid address.";
        valid = false;
    }

    if (city.value === "0") {
        cityError.textContent = "Please choose a city.";
        valid = false;
    }

    if (!payment) {
        paymentError.textContent = "Please choose a payment method.";
        valid = false;
    }

    if (!noteRegex.test(note.value.trim())) {
        noteError.textContent = "Note cannot be longer than 200 characters.";
        valid = false;
    }

    if (!terms.checked) {
        termsError.textContent = "You must accept the terms and conditions.";
        valid = false;
    }

    return valid;
}
function clearErrors() {
    document.getElementById("fullNameError").textContent = "";
    document.getElementById("emailError").textContent = "";
    document.getElementById("phoneError").textContent = "";
    document.getElementById("addressError").textContent = "";
    document.getElementById("cityError").textContent = "";
    document.getElementById("paymentError").textContent = "";
    document.getElementById("noteError").textContent = "";
    document.getElementById("termsError").textContent = "";
}

