const drop_down=document.querySelector("#drop_down");
const drop_up=document.querySelector("#drop_up");
const information=document.querySelector(".information");
if(drop_down)
{
    drop_down.addEventListener("click",(data)=>{
        information.style.display="inline-block";
        drop_down.style.display="none";
        drop_up.style.display="inline-block";
    })
    drop_up.addEventListener("click",(data)=>{
        information.style.display="none";
        drop_up.style.display="none";
        drop_down.style.display="inline-block";
    })
}


var swiper = new Swiper(".mySwiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",  
    coverflowEffect: {
      rotate: 15,
      stretch: 0,
      depth: 200,
      modifier: 1,
      slideShadows: true,
    },
    loop:true,
    autoplay: {
        delay: 1500,
      },
  });