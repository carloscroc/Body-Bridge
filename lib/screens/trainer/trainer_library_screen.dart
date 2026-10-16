import 'package:flutter/material.dart';

import '../../l10n/l10n.dart';

class TrainerLibraryScreen extends StatelessWidget {
  const TrainerLibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(t.trainerLibraryTitle)),
      body: const SizedBox.expand(),
    );
  }
}
