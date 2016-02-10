var articleSignUp = document.getElementsByClassName('article-sign-up')[0];
var formSignUp = document.getElementsByClassName('form-sign-up')[0];

function formSubmit(e){
  e.preventDefault();
  articleSignUp.classList.add('submitted');
}

window.onload = function(){
  formSignUp.addEventListener('submit', formSubmit);
};
