import 'package:intl/intl.dart';

final _dateTimeFormat = DateFormat('yyyy/M/d HH:mm');
final _dateFormat = DateFormat('yyyy/M/d');

String formatDateTime(DateTime? value) {
  if (value == null) {
    return '未設定';
  }
  return _dateTimeFormat.format(value);
}

String formatDate(DateTime value) {
  return _dateFormat.format(value);
}

String formatDurationSeconds(int seconds) {
  final hours = seconds ~/ 3600;
  final minutes = (seconds % 3600) ~/ 60;
  final rest = seconds % 60;

  if (hours > 0) {
    return '$hours時間$minutes分';
  }
  if (minutes > 0) {
    return '$minutes分$rest秒';
  }
  return '$rest秒';
}

String formatSignedHours(int seconds) {
  final sign = seconds >= 0 ? '+' : '-';
  final absSeconds = seconds.abs();
  final hours = absSeconds / 3600;
  return '$sign${hours.toStringAsFixed(1)}h';
}
