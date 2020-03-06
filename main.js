var trips = {};
var nationality = '';
var countries = [];
var countryMap = {};
var map;
var bans = {};
var restrictions = {};

function recalculateBans() {
  bans = {};
  restrictions = {};
  countries.forEach(function (country) {
    if (country.nationalBans && country.nationalBans.indexOf(nationality) > -1) {
      bans[country.id] = 1.0;
      return;
    }
    if (country.bans) {
      for (const tripCountry in trips) {
        if (country.bans[tripCountry] <= trips[tripCountry]) {
          bans[country.id] = 1.0;
          return;
        }
      }
    }
    bans[country.id] = 0.0;
    if (country.nationalRestrictions && country.nationalRestrictions.indexOf(nationality) > -1) {
      restrictions[country.id] = 1.0;
      return;
    }
    if (country.restrictions) {
      for (const tripCountry in trips) {
        if (country.restrictions[tripCountry] <= trips[tripCountry]) {
          restrictions[country.id] = 1.0;
          return;
        }
      }
    }
    restrictions[country.id] = 0.0;
  });
  // North Korea is always banned
  bans.KP = 1.0;
  map.series.regions[0].setValues(bans);
  map.series.regions[1].setValues(restrictions)
  map.clearSelectedRegions();
};

function addCountry() {
  var clone = $('#trip-template').clone();
  clone.attr('style', '');
  clone.attr('id', '');
  $('.remove-country', clone).on('click', function () {
    clone.remove();
    delete trips[countries[$('.country-selection', clone)[0].selectedIndex].id]
    recalculateBans();
  });
  $('.country-selection', clone).on('change', function (e) {
    if ($(e.currentTarget).data('oldValue')) {
      delete trips[$(e.currentTarget).data('oldValue')];
    }
    trips[countries[e.currentTarget.selectedIndex].id] = parseInt($('.time-ago', clone).val()) * -1;
    $(e.currentTarget).data('oldValue', countries[e.currentTarget.selectedIndex].id)
    recalculateBans();
  });
  $('.time-ago', clone).on('change', function (e) {
    trips[countries[$('.country-selection', clone)[0].selectedIndex].id] = parseInt(e.currentTarget.value) * -1;
    recalculateBans();
  })
  $('.trip').append(clone);
}

$('#add-country').on('click', addCountry);

$.getJSON('/data.json', function (data) {
  var options = '';
  countries = data;
  for (var country of countries) {
    options += '<option value="' + country.id + '">' + country.name + '</option>';
    countryMap[country.id] = country;
  }
  $('.country-selection').append(options)
  $('#nationality-selection').on('change', function (e) {
    nationality = countries[e.currentTarget.selectedIndex].id;
    recalculateBans();
  });
  map = new jvm.Map({
    container: $('#world-map'),
    map: 'world_mill',
    series: {
      regions: [
        { values: {}, scale: ['#00ff00', '#ff0000'], min: 0.0, max: 1.0 },
        { values: {}, scale: ['#00ff00', '#ffff00'], min: 0.0, max: 1.0 },
      ],
    },
    onRegionTipShow: function (e, el, code) {
      var text = countryMap[code] && countryMap[code].tooltip || '';
      el.html(el.html() + '<br/><pre>' + text + '</pre>');
      $('pre', el).attr('style', 'max-width:500px;white-space: pre-wrap; overflow: wrap')
    }
  });
  recalculateBans();
  addCountry();
});
