import WebFont from 'webfontloader';

WebFont.load({
    custom: {"families":["Lato:300,400,700,900", "Flaticon", "Font Awesome 5 Solid", "Font Awesome 5 Regular", "Font Awesome 5 Brands", "simple-line-icons"],
    urls: ['/static/assets/css/fonts.css']},
    active: function() {
        sessionStorage.fonts = true;
    }
});