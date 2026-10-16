import 'package:flutter/material.dart';

import '../../l10n/l10n.dart';

class CustomAssignedScreen extends StatelessWidget {
  const CustomAssignedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(t.customAssignedTitle)),
      body: const SizedBox.expand(),
    );
  }
}
