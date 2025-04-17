const image=document.querySelector("#image");
const Profile_image=document.querySelector("#Profile_image");
image.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => Profile_image.src = e.target.result;
        reader.readAsDataURL(this.files[0]);
    }
});