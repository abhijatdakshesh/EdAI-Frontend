import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/api/dio_client.dart";
import "../../core/auth/auth_provider.dart";

class _Message {
  _Message({required this.text, required this.isUser, this.loading = false});
  final String text;
  final bool isUser;
  final bool loading;
}

class ChatbotScreen extends ConsumerStatefulWidget {
  const ChatbotScreen({super.key});
  @override
  ConsumerState<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends ConsumerState<ChatbotScreen> {
  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final List<_Message> _messages = [
    _Message(text: "Hi! I'm your AI study assistant. Ask me anything about your courses, schedule, or career.", isUser: false),
  ];
  bool _loading = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _loading) return;
    _ctrl.clear();
    setState(() {
      _messages.add(_Message(text: text, isUser: true));
      _loading = true;
    });
    _scroll();
    try {
      final dio = ref.read(dioProvider);
      final session = ref.read(sessionProvider);
      final res = await dio.post<Map<String, dynamic>>("/api/chatbot/query", data: {
        "question": text,
        "userId": session?.user.id,
        "language": session?.user.preferredLanguage ?? "en",
      });
      final answer = (res.data ?? {})["answer"] as String? ?? "Sorry, I couldn't understand that.";
      setState(() {
        _messages.add(_Message(text: answer, isUser: false));
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _messages.add(_Message(text: "Error: ${e.toString()}", isUser: false));
        _loading = false;
      });
    }
    _scroll();
  }

  void _scroll() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Expanded(child: ListView.builder(
        controller: _scrollCtrl,
        padding: const EdgeInsets.all(16),
        itemCount: _messages.length,
        itemBuilder: (_, i) {
          final m = _messages[i];
          return Align(
            alignment: m.isUser ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
              decoration: BoxDecoration(
                color: m.isUser ? Theme.of(context).colorScheme.primary : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(m.text,
                  style: TextStyle(color: m.isUser ? Colors.white : Colors.black87)),
            ),
          );
        },
      )),
      if (_loading) const LinearProgressIndicator(),
      SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
          child: Row(children: [
            Expanded(child: TextField(
              controller: _ctrl,
              decoration: const InputDecoration(
                hintText: "Ask anything…",
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onSubmitted: (_) => _send(),
            )),
            const SizedBox(width: 8),
            IconButton.filled(
              icon: const Icon(Icons.send),
              onPressed: _loading ? null : _send,
            ),
          ]),
        ),
      ),
    ]);
  }
}
