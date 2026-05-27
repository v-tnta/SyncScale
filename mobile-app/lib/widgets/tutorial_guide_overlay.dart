import 'package:flutter/material.dart';

import '../state/syncscale_state.dart';

class TutorialGuideOverlay extends StatefulWidget {
  const TutorialGuideOverlay({super.key});

  @override
  State<TutorialGuideOverlay> createState() => _TutorialGuideOverlayState();
}

class _TutorialGuideOverlayState extends State<TutorialGuideOverlay> {
  Rect? _targetRect;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateTargetRect());
  }

  void _updateTargetRect() {
    if (!mounted) return;

    try {
      final appState = SyncScaleScope.of(context);
      final targetKey = appState.tutorialTargetKey;

      if (targetKey != null && targetKey.currentContext != null) {
        final box = targetKey.currentContext!.findRenderObject() as RenderBox?;
        if (box != null && box.hasSize) {
          final offset = box.localToGlobal(Offset.zero);
          final rect = offset & box.size;
          if (_targetRect != rect) {
            setState(() {
              _targetRect = rect;
            });
          }
        }
      } else {
        if (_targetRect != null) {
          setState(() {
            _targetRect = null;
          });
        }
      }
    } catch (_) {
      // 描画サイクル中のコンテキスト未検出など
    }

    if (mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _updateTargetRect());
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final step = appState.tutorialStep;

    if (step == null || step < 1 || step > 17) {
      return const SizedBox.shrink();
    }

    final details = _getStepDetails(step);
    final screenSize = MediaQuery.of(context).size;

    // ハイライト用のパディング
    const double padding = 8.0;
    Rect? inflatedRect;
    if (_targetRect != null) {
      inflatedRect = Rect.fromLTRB(
        _targetRect!.left - padding,
        _targetRect!.top - padding,
        _targetRect!.right + padding,
        _targetRect!.bottom + padding,
      );
    }

    // ターゲット未検出時は暗色背景を透明にして「塗りつぶし感」を防止
    final maskColor = inflatedRect == null ? Colors.transparent : const Color(0x730F172A); // rgba(15, 23, 42, 0.45)

    Widget buildMasksAndHighlight() {
      if (inflatedRect == null || step == 17) {
        return Container(color: maskColor);
      }

      final top = inflatedRect.top;
      final bottom = inflatedRect.bottom;
      final left = inflatedRect.left;
      final right = inflatedRect.right;
      final width = inflatedRect.width;
      final height = inflatedRect.height;

      return Stack(
        children: [
          // 上部マスク
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: top.clamp(0, screenSize.height),
            child: Container(color: maskColor),
          ),
          // 下部マスク
          Positioned(
            top: bottom.clamp(0, screenSize.height),
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(color: maskColor),
          ),
          // 左部マスク
          Positioned(
            top: top.clamp(0, screenSize.height),
            bottom: (screenSize.height - bottom).clamp(0, screenSize.height),
            left: 0,
            width: left.clamp(0, screenSize.width),
            child: Container(color: maskColor),
          ),
          // 右部マスク
          Positioned(
            top: top.clamp(0, screenSize.height),
            bottom: (screenSize.height - bottom).clamp(0, screenSize.height),
            left: right.clamp(0, screenSize.width),
            right: 0,
            child: Container(color: maskColor),
          ),
          // ハイライト枠
          Positioned(
            top: top,
            left: left,
            width: width,
            height: height,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xB23B82F6), // rgba(59, 130, 246, 0.7)
                  width: 3.0,
                ),
              ),
            ),
          ),
        ],
      );
    }

    Widget buildGuideCard() {
      double? cardTop;
      double? cardBottom;
      const double cardLeft = 16.0;
      const double cardRight = 16.0;

      if (inflatedRect == null || step == 17) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _buildCardContent(context, appState, step, details),
          ),
        );
      }

      // step 15（完了詳細の振り返り確認）は、画面最上部のコンディションパネルから
      // 最下部の作業実績まで画面全体を確認してほしいため、
      // 案内カードを画面最下部（ボトムナビゲーションバーの上付近）に固定配置します。
      if (step == 15) {
        return Positioned(
          bottom: 96.0,
          left: cardLeft,
          right: cardRight,
          child: _buildCardContent(context, appState, step, details),
        );
      }

      final top = inflatedRect.top;
      final bottom = inflatedRect.bottom;
      final spaceAbove = top;
      final spaceBelow = screenSize.height - bottom;

      // ガイドカードの予測高さは 220px 程度
      if (spaceBelow >= 220) {
        cardTop = bottom + 12.0;
      } else if (spaceAbove >= 220) {
        cardBottom = (screenSize.height - top) + 12.0;
      } else {
        if (spaceBelow > spaceAbove) {
          cardTop = (bottom + 12.0).clamp(0, screenSize.height - 220);
        } else {
          cardBottom = ((screenSize.height - top) + 12.0).clamp(0, screenSize.height - 220);
        }
      }

      return Positioned(
        top: cardTop,
        bottom: cardBottom,
        left: cardLeft,
        right: cardRight,
        child: _buildCardContent(context, appState, step, details),
      );
    }

    return Stack(
      children: [
        Positioned.fill(
          child: IgnorePointer(
            child: buildMasksAndHighlight(),
          ),
        ),
        buildGuideCard(),
      ],
    );
  }

  Widget _buildCardContent(
    BuildContext context,
    SyncScaleState appState,
    int step,
    _StepDetails details,
  ) {
    return Material(
      elevation: 16,
      shadowColor: Colors.black.withAlpha(76),
      borderRadius: BorderRadius.circular(20),
      color: Colors.white.withAlpha(242),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.blue.shade100, width: 1.5),
        ),
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade100),
                  ),
                  child: Text(
                    'チュートリアルガイド',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Text(
                  step <= 16 ? '$step / 16' : '完了',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              details.title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1E293B),
                height: 1.3,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              details.desc,
              style: TextStyle(
                fontSize: 13,
                color: Colors.blueGrey.shade600,
                height: 1.5,
              ),
            ),
            if (details.showNext || step == 17) ...[
              const SizedBox(height: 16),
              FilledButton(
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  backgroundColor: Colors.blue.shade600,
                ),
                onPressed: () async {
                  if (step == 17) {
                    await appState.completeTutorial();
                  } else {
                    appState.nextTutorialStep();
                  }
                },
                child: Text(
                  step == 17 ? 'サービスに戻る' : '次へ進む →',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
            if (step <= 16) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: step / 16,
                  minHeight: 4,
                  backgroundColor: Colors.grey.shade100,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade600),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  _StepDetails _getStepDetails(int step) {
    switch (step) {
      case 1:
        return const _StepDetails(
          title: '1/16. 登録フォームを開きましょう ➕',
          desc: '画面右下にある「タスクを登録」ボタンをタップして、課題の登録フォームを開いてみましょう。',
          showNext: false,
        );
      case 2:
        return const _StepDetails(
          title: '2/16. 課題名を入力しましょう ✏️',
          desc: 'タスクフォームの「タスク名」入力欄に、『線形代数のレポート』と入力してみましょう。',
          showNext: true,
        );
      case 3:
        return const _StepDetails(
          title: '3/16. 締切日時の確認 📅',
          desc: 'ここで締め切り時間を変更できます。\nチュートリアルでは当日の23:59に固定されています。',
          showNext: true,
        );
      case 4:
        return const _StepDetails(
          title: '4/16. 規模感を選択しましょう 📊',
          desc: '課題の規模感（S/M/L）を選択してみましょう。\nご自身の思う基準で結構です！',
          showNext: true,
        );
      case 5:
        return const _StepDetails(
          title: '5/16. 課題を登録しましょう 🚀',
          desc: '入力ができたら、「タスクを登録」ボタンを押して課題を追加しましょう！',
          showNext: false,
        );
      case 6:
        return const _StepDetails(
          title: '6/16. 課題の詳細を開きましょう 🔍',
          desc: '課題がリストに追加されました！\n追加された『線形代数のレポート』をクリックして、詳細画面を開いてみましょう。',
          showNext: false,
        );
      case 7:
        return const _StepDetails(
          title: '7/16. 課題の編集機能 ✏️',
          desc: '詳細画面が開きました！\nこちらの編集ボタン（鉛筆アイコン）から、課題のタイトルや締切、規模感（S/M/L）をいつでも編集できます。',
          showNext: true,
        );
      case 8:
        return const _StepDetails(
          title: '8/16. 課題の削除機能 🗑️',
          desc: 'こちらの完全削除ボタン（ゴミ箱アイコン）から、課題を削除できます。\n予定が変わった時や、誤って登録した時に使用します。',
          showNext: true,
        );
      case 9:
        return const _StepDetails(
          title: '9/16. タイマーで記録することもできます ⏱️',
          desc: '作業時間は、こちらのタイマーパネルで実際に測って記録することも可能です。\n今回は「作業ログを手入力」から進めます。',
          showNext: true,
        );
      case 10:
        return const _StepDetails(
          title: '10/16. 手動できろくしましょう ⏱️',
          desc: '作業時間はタイマーでも計れますが、今回は「作業ログを手入力」をタップして手動で記録してみましょう。',
          showNext: false,
        );
      case 11:
        return const _StepDetails(
          title: '11/16. 作業時間を記録しましょう 📝',
          desc: '作業時間（例: 30分）を入力し、「保存」をクリックして時間を記録してみましょう。',
          showNext: false,
        );
      case 12:
        return const _StepDetails(
          title: '12/16. 課題を提出完了にしましょう 🏆',
          desc: '時間の記録が終わりました！詳細画面にある「提出完了にする」ボタンをクリックして、課題を提出してください。',
          showNext: false,
        );
      case 13:
        return const _StepDetails(
          title: '13/16. 今のコンディションを記録しましょう 😊',
          desc: '今の気分（良・中・悪）を選択し、ひとことメモ（任意）を入力して「記録して提出完了」をクリックしてください。',
          showNext: false,
        );
      case 14:
        return const _StepDetails(
          title: '14/16. 完了したタスクを確認しましょう 🏆',
          desc: '課題が完了しました！下にスクロールして「完了したタスク」セクションにある『線形代数のレポート』をタップし、詳細画面を開きましょう。',
          showNext: false,
        );
      case 15:
        return const _StepDetails(
          title: '15/16. 振り返りを確認しましょう 📊',
          desc: '完了した課題のコンディションや作業ログが表示されます。\n確認したら、詳細画面を閉してください。',
          showNext: false,
        );
      case 16:
        return const _StepDetails(
          title: '16/16. カレンダーで振り返りを確認しましょう 📅',
          desc: 'カレンダータブをタップして、完了した課題がどのようにカレンダー上に表示されているか確認しましょう。',
          showNext: false,
        );
      case 17:
        return const _StepDetails(
          title: 'チュートリアル完了！ 🎉',
          desc: 'お疲れ様でした！これで基本的な操作はマスターです。\nSyncScaleには、manabaから課題を自動インポートできる便利なChrome拡張機能も備わっています。\nそれでは実際に使い始めてみましょう！',
          showNext: false,
        );
      default:
        return const _StepDetails(title: '', desc: '', showNext: false);
    }
  }
}

class _StepDetails {
  const _StepDetails({
    required this.title,
    required this.desc,
    required this.showNext,
  });

  final String title;
  final String desc;
  final bool showNext;
}
