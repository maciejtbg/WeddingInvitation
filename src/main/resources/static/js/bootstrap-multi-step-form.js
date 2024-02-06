var step = 1;
$(document).ready(function () { stepProgress(step); });

$(".next").on("click", function () {
    if (step < $(".step").length) {
      $(".step").show();
      $(".step")
        .not(":eq(" + step++ + ")")
        .hide();
      stepProgress(step);
    }
    hideButtons(step);

});

// ON CLICK BACK BUTTON
$(".back").on("click", function () {
  if (step > 1) {
    step = step - 2;
    $(".next").trigger("click");
  }
  hideButtons(step);
});

// CALCULATE PROGRESS BAR
stepProgress = function (currstep) {
  var percent = parseFloat(100 / $(".step").length) * currstep;
  percent = percent.toFixed();
  $(".progress-bar")
    .css("width", percent + "%")
    .html(percent + "%");
};

// DISPLAY AND HIDE "NEXT", "BACK" AND "SUMBIT" BUTTONS
hideButtons = function (step) {
  var limit = parseInt($(".step").length);
  $(".action").hide();
  if (step < limit) {
    $(".next").show();
  }
  if (step > 1) {
    $(".back").show();
  }
  if (step == limit) {
    $(".next").hide();
    $(".submit").show();
  }
};

function checkForm(val) {
  // CHECK IF ALL "REQUIRED" FIELD ALL FILLED IN
  var valid = true;
  $("#" + val + " input:required").each(function () {
    if ($(this).val() === "") {
      $(this).addClass("is-invalid");
      valid = false;
    } else {
      $(this).removeClass("is-invalid");
    }
  });
  return valid;
}