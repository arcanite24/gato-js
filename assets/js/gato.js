/* Helpers */
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function checkWin(board, token) {
  if(board[0] == token && board[1] == token && board[2] == token) return true;
  if(board[3] == token && board[4] == token && board[5] == token) return true;
  if(board[6] == token && board[7] == token && board[8] == token) return true;
  if(board[0] == token && board[3] == token && board[6] == token) return true;
  if(board[1] == token && board[4] == token && board[7] == token) return true;
  if(board[2] == token && board[5] == token && board[8] == token) return true;
  if(board[0] == token && board[4] == token && board[8] == token) return true;
  if(board[2] == token && board[4] == token && board[6] == token) return true;
  return false;
}

function winGame(token) {
  $('#game-panel').hide();
  $('#info-panel').hide();
  if(token == my_token) {
    $('#final-message-win').fadeIn();
  } else {
    $('#final-message-lose').fadeIn();
  }
}

var HOST = 'http://localhost';
var PORT = '8080';

my_token = null;
game_room = '';
sala = [];
current_turn = '';
board = [-1, -1, -1, -1, -1, -1, -1, -1, -1,];

socket = io.connect(HOST + ':' + PORT);
socket.on('player-join', function (data) {
  if(!game_room || game_room.length <= 0) return;
  if(game_room != data.room_id) return;
  sala = data.room;
  if(data.initial) current_turn = data.initial;
  $('#info-players').text(sala.length);
  $('#info-turno').text(current_turn == socket.id ? 'Mi turno' : 'Turno del adversario');
});
socket.on('token-played', function (data) {
  if(data.room != game_room) return;
  board[parseInt(data.cell)] = parseInt(data.token);
  $('#cell-'+(parseInt(data.cell)+1)).text(parseInt(data.token) == 0 ? 'X' : 'O');
  if(checkWin(board, 0)) return winGame(0);
  if(checkWin(board, 1)) return winGame(1);
  current_turn = sala[sala.indexOf(data.player) == 0 ?  1 : 0];
  $('#info-turno').text(current_turn == socket.id ? 'Mi turno' : 'Turno del adversario');
});

$(function () {

  function loadGame(id) {
    $('#game-panel').show();
    $('#info-panel').show();
    $('#game-panel').addClass('fadeInLeftBig');
    $('#info-panel').addClass('fadeInRightBig');

    $('#info-room').text(id);
    $('#info-players').text(sala.length);
  }

  $('#button-reset').click(function () {
    location.reload();
  })

  $('.cell').click(function (e) {
    if(current_turn != socket.id) return e.preventDefault();
    if(sala.length < 2) return e.preventDefault();
    var _this = $(this);
    var cell = parseInt(_this.attr('id').replace('cell-', '')) - 1;
    if (board[cell] > -1) return toastr.error('Ahí ya hay una ficha.');
    //console.log(cell);
    $.post('/playToken/'+game_room+'/'+socket.id+'/'+cell+'/'+my_token, function (res) {
      //console.log(res);
    });
  })

  $('#button-new').click(function () {
    var id = guid();
    game_room = id;
    $.post('/join/'+id+'/'+socket.id, function (res) {
      if (res.err) return toastr.error(res.err);
      $('#login-panel').fadeOut();
      toastr.success('Unido correctamente a la sala: ' + id);
      game_room = id;
      sala = res.room;
      loadGame(id);
    });
  });

  $('#button-join').click(function () {
    var id = $('#input-room').val();
    game_room = id;
    if(!id || id.length <= 0) return toastr.error('Ingresa una sala...');
    $.post('/join/'+id+'/'+socket.id, function (res) {
      if (res.err) return toastr.error(res.err);
      $('#login-panel').addClass('fadeOutDown');
      setTimeout(function () {
        $('#login-panel').hide();
      }, 1000);
      toastr.success('Unido correctamente a la sala: ' + id);
      game_room = id;
      sala = res.room;
      my_token = res.token;
      //console.log('my token', my_token);
      loadGame(id);
    });
  });

});
