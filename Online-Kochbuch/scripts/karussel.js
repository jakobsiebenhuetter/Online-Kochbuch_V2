const leftButton = document.getElementById("slide-arrow-left")
const rigthButton = document.getElementById("slide-arrow-rigth");
const slide = document.querySelector(".slide");
const slidesContainer = document.querySelector(".slides-container")

leftButton.addEventListener('click', function()  {

slidesContainer.scrollLeft -=slide.clientWidth

})

rigthButton.addEventListener('click', function()  {
   
    slidesContainer.scrollLeft +=slide.clientWidth
}
)